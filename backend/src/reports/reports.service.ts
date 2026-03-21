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

  async producerBalance(producerId: string) {
    // Sum tanker producer receivables from Draft + Final invoices only
    const tankerAgg = await this.prisma.tanker.aggregate({
      where: {
        producerId,
        invoice: { status: { in: ['draft', 'final'] } },
      },
      _sum: {
        producerReceivableAfn: true,
        producerReceivableUsd: true,
      },
    })

    // Payments made TO this producer (they are the payee)
    const paymentAgg = await this.prisma.monetaryTransaction.aggregate({
      where: { payeeAccountId: producerId },
      _sum: { amountAfn: true, amountUsd: true },
    })

    const totalReceivableAfn = tankerAgg._sum.producerReceivableAfn ?? new Prisma.Decimal(0)
    const totalReceivableUsd = tankerAgg._sum.producerReceivableUsd ?? new Prisma.Decimal(0)
    const paidAfn = paymentAgg._sum.amountAfn ?? new Prisma.Decimal(0)
    const paidUsd = paymentAgg._sum.amountUsd ?? new Prisma.Decimal(0)

    return {
      producerId,
      totalReceivableAfn,
      totalReceivableUsd,
      paidAfn,
      paidUsd,
      balanceAfn: totalReceivableAfn.minus(paidAfn),
      balanceUsd: totalReceivableUsd.minus(paidUsd),
    }
  }

  async producerBalances() {
    const producers = await this.prisma.account.findMany({
      where: { type: 'producer', isActive: true },
      select: { id: true, name: true },
    })
    const all = await Promise.all(
      producers.map(async (p) => {
        const result = await this.producerBalance(p.id)
        return { producer: p, ...result }
      }),
    )
    return all.filter(
      (r) =>
        !r.totalReceivableAfn.isZero() ||
        !r.totalReceivableUsd.isZero() ||
        !r.paidAfn.isZero() ||
        !r.paidUsd.isZero(),
    )
  }

  async dashboard() {
    const [allCustomerBalances, allProducerBalances] = await Promise.all([
      this.customerBalances(),
      this.producerBalances(),
    ])

    const totalBalanceAfn = allCustomerBalances.reduce((s, b) => s + Number(b.balanceAfn), 0)
    const totalBalanceUsd = allCustomerBalances.reduce((s, b) => s + Number(b.balanceUsd), 0)
    const totalProducerPayableAfn = allProducerBalances.reduce((s, b) => s + Number(b.balanceAfn), 0)
    const totalProducerPayableUsd = allProducerBalances.reduce((s, b) => s + Number(b.balanceUsd), 0)

    const topCustomers = allCustomerBalances
      .filter((b) => Number(b.balanceAfn) > 0 || Number(b.balanceUsd) > 0)
      .sort((a, b) => Number(b.balanceAfn) - Number(a.balanceAfn))
      .slice(0, 6)
      .map((b) => ({
        id: b.customer.id,
        name: b.customer.name,
        balanceAfn: Number(b.balanceAfn),
        balanceUsd: Number(b.balanceUsd),
      }))

    const topProducers = allProducerBalances
      .filter((b) => Number(b.balanceAfn) > 0 || Number(b.balanceUsd) > 0)
      .sort((a, b) => Number(b.balanceAfn) - Number(a.balanceAfn))
      .slice(0, 6)
      .map((b) => ({
        id: b.producer.id,
        name: b.producer.name,
        balanceAfn: Number(b.balanceAfn),
        balanceUsd: Number(b.balanceUsd),
      }))

    const [draftCount, finalCount, canceledCount, recentInvoices, draftInvoices, recentPayments] = await Promise.all([
      this.prisma.invoice.count({ where: { status: 'draft' } }),
      this.prisma.invoice.count({ where: { status: 'final' } }),
      this.prisma.invoice.count({ where: { status: 'canceled' } }),
      this.prisma.invoice.findMany({
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true } } },
      }),
      this.prisma.invoice.findMany({
        where: { status: 'draft' },
        take: 8,
        orderBy: { createdAt: 'desc' },
        include: { customer: { select: { id: true, name: true } } },
      }),
      this.prisma.monetaryTransaction.findMany({
        take: 10,
        orderBy: { transactionDate: 'desc' },
        include: {
          payer: { select: { id: true, name: true } },
          payee: { select: { id: true, name: true } },
        },
      }),
    ])

    const mapInvoice = (inv: typeof recentInvoices[0]) => ({
      id: inv.id,
      invoiceNumber: inv.invoiceNumber,
      customer: inv.customer,
      status: inv.status,
      issueDate: inv.issueDate,
    })

    return {
      totalBalanceAfn,
      totalBalanceUsd,
      totalProducerPayableAfn,
      totalProducerPayableUsd,
      invoiceCounts: { draft: draftCount, final: finalCount, canceled: canceledCount },
      topCustomers,
      topProducers,
      recentInvoices: recentInvoices.map(mapInvoice),
      draftInvoices: draftInvoices.map(mapInvoice),
      recentPayments: recentPayments.map((pmt) => ({
        id: pmt.id,
        type: pmt.type,
        payer: pmt.payer,
        payee: pmt.payee,
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
