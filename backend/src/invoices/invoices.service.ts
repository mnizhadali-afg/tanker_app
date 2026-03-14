import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
  ConflictException,
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
    if (!invoice) throw new NotFoundException('Invoice not found')
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
      if (!contract) throw new NotFoundException('Contract not found')
      if (!contract.isActive) throw new BadRequestException('Cannot create invoice for an inactive contract')
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
      throw new BadRequestException('Only draft invoices can be finalized')
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
      throw new BadRequestException('Invoice is already canceled')
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
    const invoice = await this.findOne(id)
    if (invoice.status !== 'draft') {
      throw new ConflictException('Only draft invoices can be deleted')
    }
    // Delete tankers first, then invoice
    await this.prisma.$transaction([
      this.prisma.tanker.deleteMany({ where: { invoiceId: id } }),
      this.prisma.invoice.delete({ where: { id } }),
    ])
  }

  assertEditable(invoice: { status: string }) {
    if (invoice.status === 'final') {
      throw new ForbiddenException('Finalized invoices are immutable')
    }
    if (invoice.status === 'canceled') {
      throw new ForbiddenException('Canceled invoices are immutable')
    }
  }
}
