import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  async customerBalance(customerId: string) {
    // Sum tanker debts from Draft + Final invoices only
    const tankerAgg = await this.prisma.tanker.aggregate({
      where: {
        invoice: {
          customerId,
          status: { in: ['draft', 'final'] },
        },
      },
      _sum: {
        customerDebtAfn: true,
        customerDebtUsd: true,
        customerDebtCommodity: true,
      },
    })

    // Sum monetary payments for this customer
    const paymentAgg = await this.prisma.monetaryTransaction.aggregate({
      where: { customerId },
      _sum: {
        amountAfn: true,
        amountUsd: true,
      },
    })

    // Sum commodity transactions for this customer
    const commodityAgg = await this.prisma.commodityTransaction.aggregate({
      where: { customerId },
      _sum: { quantity: true },
    })

    const totalDebtAfn = tankerAgg._sum.customerDebtAfn ?? new Prisma.Decimal(0)
    const totalDebtUsd = tankerAgg._sum.customerDebtUsd ?? new Prisma.Decimal(0)
    const totalDebtCommodity = tankerAgg._sum.customerDebtCommodity ?? new Prisma.Decimal(0)
    const paidAfn = paymentAgg._sum.amountAfn ?? new Prisma.Decimal(0)
    const paidUsd = paymentAgg._sum.amountUsd ?? new Prisma.Decimal(0)
    const paidCommodity = commodityAgg._sum.quantity ?? new Prisma.Decimal(0)

    return {
      customerId,
      balanceAfn: totalDebtAfn.minus(paidAfn),
      balanceUsd: totalDebtUsd.minus(paidUsd),
      balanceCommodity: totalDebtCommodity.minus(paidCommodity),
      totalDebtAfn,
      totalDebtUsd,
      totalDebtCommodity,
      paidAfn,
      paidUsd,
      paidCommodity,
    }
  }

  async invoiceStatus(customerId?: string, dateFrom?: string, dateTo?: string) {
    const invoices = await this.prisma.invoice.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(dateFrom || dateTo
          ? {
              issueDate: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, code: true, calculationType: true } },
        _count: { select: { tankers: true } },
      },
      orderBy: { createdAt: 'desc' },
    })

    // For each invoice, aggregate tanker totals
    const results = await Promise.all(
      invoices.map(async (inv) => {
        const agg = await this.prisma.tanker.aggregate({
          where: { invoiceId: inv.id },
          _sum: {
            customerDebtAfn: true,
            customerDebtUsd: true,
          },
        })

        const paidAgg = await this.prisma.monetaryTransaction.aggregate({
          where: { invoiceId: inv.id },
          _sum: { amountAfn: true, amountUsd: true },
        })

        return {
          ...inv,
          totalDebtAfn: agg._sum.customerDebtAfn ?? new Prisma.Decimal(0),
          totalDebtUsd: agg._sum.customerDebtUsd ?? new Prisma.Decimal(0),
          paidAfn: paidAgg._sum.amountAfn ?? new Prisma.Decimal(0),
          paidUsd: paidAgg._sum.amountUsd ?? new Prisma.Decimal(0),
        }
      }),
    )

    return results
  }

  async customerBalances() {
    const customers = await this.prisma.account.findMany({
      where: { type: 'customer', isActive: true },
      select: { id: true, name: true },
    })
    return Promise.all(
      customers.map(async (c) => {
        const result = await this.customerBalance(c.id)
        return { customer: c, ...result }
      }),
    )
  }

  async dashboard() {
    const allBalances = await this.customerBalances()
    const totalBalanceAfn = allBalances.reduce((s, b) => s + Number(b.balanceAfn), 0)
    const totalBalanceUsd = allBalances.reduce((s, b) => s + Number(b.balanceUsd), 0)

    const recentInvoices = await this.prisma.invoice.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: { customer: { select: { id: true, name: true } } },
    })

    const recentPayments = await this.prisma.monetaryTransaction.findMany({
      take: 10,
      orderBy: { transactionDate: 'desc' },
      include: { payer: { select: { id: true, name: true } } },
    })

    return {
      totalBalanceAfn,
      totalBalanceUsd,
      recentInvoices: recentInvoices.map((inv) => ({
        id: inv.id,
        invoiceNumber: inv.invoiceNumber,
        customer: inv.customer,
        status: inv.status,
        issueDate: inv.issueDate,
      })),
      recentPayments: recentPayments.map((pmt) => ({
        id: pmt.id,
        type: pmt.type,
        customer: pmt.payer,
        amountAfn: pmt.amountAfn ? Number(pmt.amountAfn) : null,
        amountUsd: pmt.amountUsd ? Number(pmt.amountUsd) : null,
        transactionDate: pmt.transactionDate,
      })),
    }
  }

  transactionHistory(customerId?: string, invoiceId?: string, dateFrom?: string, dateTo?: string) {
    return this.prisma.monetaryTransaction.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
        ...(dateFrom || dateTo
          ? {
              transactionDate: {
                ...(dateFrom ? { gte: new Date(dateFrom) } : {}),
                ...(dateTo ? { lte: new Date(dateTo) } : {}),
              },
            }
          : {}),
      },
      include: {
        payer: { select: { id: true, name: true } },
        payee: { select: { id: true, name: true } },
        invoice: { select: { id: true, invoiceNumber: true } },
        createdBy: { select: { id: true, username: true } },
      },
      orderBy: { transactionDate: 'desc' },
    })
  }
}
