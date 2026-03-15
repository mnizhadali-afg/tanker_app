import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { InvoicesService } from '../invoices/invoices.service'
import { CreateTankerDto } from './dto/create-tanker.dto'
import { UpdateTankerDto } from './dto/update-tanker.dto'
import { calculateTanker, type TankerCosts, type CalculationType } from '@tanker/shared'

type ContractCalcType = 'cost_based' | 'cost_based_usd' | 'per_ton'

function buildCostsFromDto(dto: CreateTankerDto | UpdateTankerDto, existing?: Record<string, unknown>): TankerCosts {
  const get = (key: string, fallback = 0) => {
    const val = (dto as Record<string, unknown>)[key]
    return val !== undefined ? Number(val) : (existing ? Number(existing[key] ?? 0) : fallback)
  }

  return {
    productWeight: get('productWeight'),
    billWeight: get('billWeight'),
    tonnageBasis: ((dto as CreateTankerDto).tonnageBasis ?? (existing?.tonnageBasis as string) ?? 'product_weight') as TankerCosts['tonnageBasis'],
    exchangeRate: get('exchangeRate'),
    costProduct: get('costProduct'),
    costPublicBenefits: get('costPublicBenefits'),
    costFmn60: get('costFmn60'),
    costFmn20: get('costFmn20'),
    costQualityControl: get('costQualityControl'),
    costDozbalagh_customer: get('costDozbalagh_customer'),
    costDozbalagh_producer: get('costDozbalagh_producer'),
    costEscort_customer: get('costEscort_customer'),
    costEscort_producer: get('costEscort_producer'),
    costBascule_customer: get('costBascule_customer'),
    costBascule_producer: get('costBascule_producer'),
    costOvernight_customer: get('costOvernight_customer'),
    costOvernight_producer: get('costOvernight_producer'),
    costBankCommission_customer: get('costBankCommission_customer'),
    costBankCommission_producer: get('costBankCommission_producer'),
    costRentAfn_customer: get('costRentAfn_customer'),
    costRentAfn_producer: get('costRentAfn_producer'),
    costMiscAfn_customer: get('costMiscAfn_customer'),
    costMiscAfn_producer: get('costMiscAfn_producer'),
    costBrokerCommission_customer: get('costBrokerCommission_customer'),
    costBrokerCommission_producer: get('costBrokerCommission_producer'),
    costExchangerCommission_customer: get('costExchangerCommission_customer'),
    costExchangerCommission_producer: get('costExchangerCommission_producer'),
    costLicenseCommission_customer: get('costLicenseCommission_customer'),
    costLicenseCommission_producer: get('costLicenseCommission_producer'),
    costRentUsd_customer: get('costRentUsd_customer'),
    costRentUsd_producer: get('costRentUsd_producer'),
    costMiscUsd_customer: get('costMiscUsd_customer'),
    costMiscUsd_producer: get('costMiscUsd_producer'),
    transportCost: get('transportCost'),
    commodityPercentDebt: get('commodityPercentDebt'),
    ratePerTonAfn: get('ratePerTonAfn'),
    ratePerTonUsd: get('ratePerTonUsd'),
  }
}

const TANKER_INCLUDE = {
  port: { select: { id: true, name: true, producerId: true } },
  producer: { select: { id: true, name: true } },
  license: { select: { id: true, licenseNumber: true } },
}

@Injectable()
export class TankersService {
  constructor(
    private prisma: PrismaService,
    private invoicesService: InvoicesService,
  ) {}

  findByInvoice(invoiceId: string) {
    return this.prisma.tanker.findMany({
      where: { invoiceId },
      include: TANKER_INCLUDE,
      orderBy: { entryDate: 'asc' },
    })
  }

  async findOne(id: string) {
    const tanker = await this.prisma.tanker.findUnique({
      where: { id },
      include: TANKER_INCLUDE,
    })
    if (!tanker) throw new NotFoundException('Tanker not found')
    return tanker
  }

  async create(dto: CreateTankerDto) {
    const invoice = await this.invoicesService.findOne(dto.invoiceId)
    this.invoicesService.assertEditable(invoice)

    // Derive contractId from the invoice if not provided
    const contractId = dto.contractId || invoice.contract.id

    // Derive producerId from the port if not provided
    let producerId = dto.producerId
    if (!producerId && dto.portId) {
      const port = await this.prisma.port.findUnique({ where: { id: dto.portId } })
      if (port) producerId = port.producerId
    }

    if (!dto.portId) throw new BadRequestException('portId is required')
    if (!producerId) throw new BadRequestException('producerId could not be resolved — select a port with an associated producer')

    const contractType = invoice.contract.calculationType as ContractCalcType
    const costs = buildCostsFromDto(dto)
    const calc = calculateTanker(costs, contractType as CalculationType)

    return this.prisma.tanker.create({
      data: {
        invoiceId: dto.invoiceId,
        contractId,
        portId: dto.portId,
        producerId,
        licenseId: dto.licenseId || null,
        tankerNumber: dto.tankerNumber ?? '',
        entryDate: new Date(dto.entryDate ?? new Date()),
        productWeight: new Prisma.Decimal(dto.productWeight ?? 0),
        billWeight: new Prisma.Decimal(dto.billWeight ?? 0),
        tonnageBasis: dto.tonnageBasis ?? 'product_weight',
        exchangeRate: new Prisma.Decimal(dto.exchangeRate ?? 0),
        costProduct: new Prisma.Decimal(dto.costProduct ?? 0),
        costPublicBenefits: new Prisma.Decimal(dto.costPublicBenefits ?? 0),
        costFmn60: new Prisma.Decimal(dto.costFmn60 ?? 0),
        costFmn20: new Prisma.Decimal(dto.costFmn20 ?? 0),
        costQualityControl: new Prisma.Decimal(dto.costQualityControl ?? 0),
        costDozbalagh_customer: new Prisma.Decimal(dto.costDozbalagh_customer ?? 0),
        costDozbalagh_producer: new Prisma.Decimal(dto.costDozbalagh_producer ?? 0),
        costEscort_customer: new Prisma.Decimal(dto.costEscort_customer ?? 0),
        costEscort_producer: new Prisma.Decimal(dto.costEscort_producer ?? 0),
        costBascule_customer: new Prisma.Decimal(dto.costBascule_customer ?? 0),
        costBascule_producer: new Prisma.Decimal(dto.costBascule_producer ?? 0),
        costOvernight_customer: new Prisma.Decimal(dto.costOvernight_customer ?? 0),
        costOvernight_producer: new Prisma.Decimal(dto.costOvernight_producer ?? 0),
        costBankCommission_customer: new Prisma.Decimal(dto.costBankCommission_customer ?? 0),
        costBankCommission_producer: new Prisma.Decimal(dto.costBankCommission_producer ?? 0),
        costRentAfn_customer: new Prisma.Decimal(dto.costRentAfn_customer ?? 0),
        costRentAfn_producer: new Prisma.Decimal(dto.costRentAfn_producer ?? 0),
        costMiscAfn_customer: new Prisma.Decimal(dto.costMiscAfn_customer ?? 0),
        costMiscAfn_producer: new Prisma.Decimal(dto.costMiscAfn_producer ?? 0),
        costBrokerCommission_customer: new Prisma.Decimal(dto.costBrokerCommission_customer ?? 0),
        costBrokerCommission_producer: new Prisma.Decimal(dto.costBrokerCommission_producer ?? 0),
        costExchangerCommission_customer: new Prisma.Decimal(dto.costExchangerCommission_customer ?? 0),
        costExchangerCommission_producer: new Prisma.Decimal(dto.costExchangerCommission_producer ?? 0),
        costLicenseCommission_customer: new Prisma.Decimal(dto.costLicenseCommission_customer ?? 0),
        costLicenseCommission_producer: new Prisma.Decimal(dto.costLicenseCommission_producer ?? 0),
        costRentUsd_customer: new Prisma.Decimal(dto.costRentUsd_customer ?? 0),
        costRentUsd_producer: new Prisma.Decimal(dto.costRentUsd_producer ?? 0),
        costMiscUsd_customer: new Prisma.Decimal(dto.costMiscUsd_customer ?? 0),
        costMiscUsd_producer: new Prisma.Decimal(dto.costMiscUsd_producer ?? 0),
        transportCost: new Prisma.Decimal(dto.transportCost ?? 0),
        commodityPercentDebt: new Prisma.Decimal(dto.commodityPercentDebt ?? 0),
        ratePerTonAfn: new Prisma.Decimal(dto.ratePerTonAfn ?? 0),
        ratePerTonUsd: new Prisma.Decimal(dto.ratePerTonUsd ?? 0),
        customerDebtAfn: calc.customerDebtAfn,
        customerDebtUsd: calc.customerDebtUsd,
        customerDebtCommodity: calc.customerDebtCommodity,
        producerReceivableAfn: calc.producerReceivableAfn,
        producerReceivableUsd: calc.producerReceivableUsd,
      },
      include: TANKER_INCLUDE,
    })
  }

  async update(id: string, dto: UpdateTankerDto) {
    const tanker = await this.findOne(id)
    const invoice = await this.invoicesService.findOne(tanker.invoiceId)
    this.invoicesService.assertEditable(invoice)

    const existing = tanker as unknown as Record<string, unknown>
    const costs = buildCostsFromDto(dto, existing)
    const contractType = invoice.contract.calculationType as ContractCalcType
    const calc = calculateTanker(costs, contractType as CalculationType)

    const updateData: Record<string, unknown> = { ...dto }

    // If portId changed and producerId not provided, re-derive producerId from port
    if (dto.portId && !dto.producerId) {
      const port = await this.prisma.port.findUnique({ where: { id: dto.portId } })
      if (port) updateData.producerId = port.producerId
    }

    if (dto.entryDate) updateData.entryDate = new Date(dto.entryDate)
    if (dto.licenseId === '') updateData.licenseId = null

    // Override calculated fields
    updateData.customerDebtAfn = calc.customerDebtAfn
    updateData.customerDebtUsd = calc.customerDebtUsd
    updateData.customerDebtCommodity = calc.customerDebtCommodity
    updateData.producerReceivableAfn = calc.producerReceivableAfn
    updateData.producerReceivableUsd = calc.producerReceivableUsd

    return this.prisma.tanker.update({
      where: { id },
      data: updateData,
      include: TANKER_INCLUDE,
    })
  }

  async remove(id: string) {
    const tanker = await this.findOne(id)
    const invoice = await this.invoicesService.findOne(tanker.invoiceId)
    this.invoicesService.assertEditable(invoice)
    return this.prisma.tanker.delete({ where: { id } })
  }

  async bulkCreate(invoiceId: string, dtos: CreateTankerDto[]) {
    const invoice = await this.invoicesService.findOne(invoiceId)
    this.invoicesService.assertEditable(invoice)

    return Promise.all(dtos.map((dto) => this.create({ ...dto, invoiceId })))
  }
}
