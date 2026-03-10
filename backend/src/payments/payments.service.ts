import { Injectable, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateMonetaryTransactionDto } from './dto/create-monetary-transaction.dto'
import { CreateCommodityTransactionDto } from './dto/create-commodity-transaction.dto'

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  async createMonetary(dto: CreateMonetaryTransactionDto, userId: string) {
    if (dto.type === 'exchange' && !dto.exchangeRate) {
      throw new BadRequestException('exchangeRate is required for exchange transactions')
    }
    if (dto.linkedLevel === 'invoice' && !dto.invoiceId) {
      throw new BadRequestException('invoiceId is required when linkedLevel is invoice')
    }
    if (dto.linkedLevel === 'contract' && !dto.contractId) {
      throw new BadRequestException('contractId is required when linkedLevel is contract')
    }

    return this.prisma.monetaryTransaction.create({
      data: {
        type: dto.type,
        payerAccountId: dto.payerAccountId,
        payeeAccountId: dto.payeeAccountId,
        monetaryAccountId: dto.monetaryAccountId,
        linkedLevel: dto.linkedLevel,
        customerId: dto.customerId,
        contractId: dto.contractId,
        invoiceId: dto.invoiceId,
        amountAfn: dto.amountAfn ? new Prisma.Decimal(dto.amountAfn) : new Prisma.Decimal(0),
        amountUsd: dto.amountUsd ? new Prisma.Decimal(dto.amountUsd) : new Prisma.Decimal(0),
        exchangeRate: dto.exchangeRate ? new Prisma.Decimal(dto.exchangeRate) : null,
        transactionDate: new Date(dto.transactionDate),
        notes: dto.notes,
        createdById: userId,
      },
    })
  }

  async createCommodity(dto: CreateCommodityTransactionDto, userId: string) {
    return this.prisma.commodityTransaction.create({
      data: {
        customerId: dto.customerId,
        contractId: dto.contractId,
        invoiceId: dto.invoiceId,
        productId: dto.productId,
        quantity: new Prisma.Decimal(dto.quantity),
        unit: dto.unit,
        transactionDate: new Date(dto.transactionDate),
        notes: dto.notes,
        createdById: userId,
      },
    })
  }

  findMonetary(customerId?: string, invoiceId?: string, contractId?: string) {
    return this.prisma.monetaryTransaction.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(invoiceId ? { invoiceId } : {}),
        ...(contractId ? { contractId } : {}),
      },
      include: {
        payer: { select: { id: true, name: true } },
        payee: { select: { id: true, name: true } },
        monetaryAccount: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: 'desc' },
    })
  }

  findCommodity(customerId?: string) {
    return this.prisma.commodityTransaction.findMany({
      where: customerId ? { customerId } : {},
      include: {
        customer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { transactionDate: 'desc' },
    })
  }
}
