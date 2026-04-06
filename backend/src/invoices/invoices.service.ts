import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { InvoiceFilterDto } from './dto/invoice-filter.dto'

const INVOICE_PREFIX = 'GAS-MO'

@Injectable()
export class InvoicesService {
  constructor(private prisma: PrismaService) {}

  async findAll(filter: InvoiceFilterDto) {
    return this.prisma.invoice.findMany({
      where: {
        ...(filter.status ? { status: filter.status } : {}),
        ...(filter.customerId ? { customerId: filter.customerId } : {}),
        ...(filter.contractId ? { contractId: filter.contractId } : {}),
        ...(filter.dateFrom || filter.dateTo
          ? {
              issueDate: {
                ...(filter.dateFrom ? { gte: new Date(filter.dateFrom) } : {}),
                ...(filter.dateTo ? { lte: new Date(filter.dateTo) } : {}),
              },
            }
          : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        contract: { select: { id: true, code: true, calculationType: true } },
        createdBy: { select: { id: true, username: true } },
        _count: { select: { tankers: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const invoice = await this.prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        contract: {
          select: {
            id: true,
            code: true,
            calculationType: true,
            defaultRatePerTonAfn: true,
            defaultRatePerTonUsd: true,
            defaultExchangeRate: true,
            otherDefaultCosts: true,
            notes: true,
          },
        },
        createdBy: { select: { id: true, username: true } },
        finalizedBy: { select: { id: true, username: true } },
        canceledBy: { select: { id: true, username: true } },
        tankers: {
          orderBy: { entryDate: 'asc' },
          include: {
            port: { select: { id: true, name: true, producerId: true } },
            producer: { select: { id: true, name: true } },
            license: { select: { id: true, licenseNumber: true } },
          },
        },
      },
    })
    if (!invoice) throw new NotFoundException('errors.notFound')
    return invoice
  }

  async create(dto: CreateInvoiceDto, userId: string) {
    // Derive customerId from contract if not provided
    let customerId = dto.customerId
    if (!customerId) {
      const contract = await this.prisma.contract.findUnique({
        where: { id: dto.contractId },
        select: { customerId: true, isActive: true },
      })
      if (!contract) throw new NotFoundException('errors.notFound')
      if (!contract.isActive) throw new BadRequestException('errors.inactiveContract')
      customerId = contract.customerId
    }

    // Atomic invoice number generation using a Postgres sequence
    const result = await this.prisma.$queryRaw<[{ nextval: bigint }]>`
      SELECT nextval('invoice_number_seq')
    `
    const seq = Number(result[0].nextval)
    const invoiceNumber = `${INVOICE_PREFIX}-${String(seq).padStart(4, '0')}`

    return this.prisma.invoice.create({
      data: {
        invoiceNumber,
        contractId: dto.contractId,
        customerId,
        issueDate: new Date(dto.issueDate),
        notes: dto.notes,
        createdById: userId,
        status: 'draft',
      },
    })
  }

  async finalize(id: string, userId: string) {
    const invoice = await this.findOne(id)
    if (invoice.status !== 'draft') {
      throw new BadRequestException('errors.invoiceNotDraft')
    }
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'final',
        finalizedAt: new Date(),
        finalizedById: userId,
      },
    })
  }

  async cancel(id: string, userId: string) {
    const invoice = await this.findOne(id)
    if (invoice.status === 'canceled') {
      throw new BadRequestException('errors.invoiceAlreadyCanceled')
    }
    return this.prisma.invoice.update({
      where: { id },
      data: {
        status: 'canceled',
        canceledAt: new Date(),
        canceledById: userId,
      },
    })
  }

  async delete(id: string) {
    await this.findOne(id)
    await this.prisma.$transaction([
      // Nullify FK on linked payments (they become account-level records)
      this.prisma.monetaryTransaction.updateMany({
        where: { invoiceId: id },
        data: { invoiceId: null },
      }),
      this.prisma.commodityTransaction.updateMany({
        where: { invoiceId: id },
        data: { invoiceId: null },
      }),
      // Detach adjustment invoices that reference this as parent
      this.prisma.invoice.updateMany({
        where: { parentId: id },
        data: { parentId: null },
      }),
      // Delete tankers, then the invoice itself
      this.prisma.tanker.deleteMany({ where: { invoiceId: id } }),
      this.prisma.invoice.delete({ where: { id } }),
    ])
  }

  assertEditable(invoice: { status: string }) {
    if (invoice.status === 'final') {
      throw new ForbiddenException('errors.invoiceImmutableFinal')
    }
    if (invoice.status === 'canceled') {
      throw new ForbiddenException('errors.invoiceImmutableCanceled')
    }
  }
}
