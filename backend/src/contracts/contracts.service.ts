import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateContractDto } from './dto/create-contract.dto'
import { UpdateContractDto } from './dto/update-contract.dto'

@Injectable()
export class ContractsService {
  constructor(private prisma: PrismaService) {}

  findAll(customerId?: string, isActive?: boolean) {
    return this.prisma.contract.findMany({
      where: {
        ...(customerId ? { customerId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        customer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const contract = await this.prisma.contract.findUnique({
      where: { id },
      include: {
        customer: { select: { id: true, name: true } },
        product: { select: { id: true, name: true } },
      },
    })
    if (!contract) throw new NotFoundException('Contract not found')
    return contract
  }

  async create(dto: CreateContractDto) {
    const existing = await this.prisma.contract.findUnique({ where: { code: dto.code } })
    if (existing) throw new ConflictException('Contract code already exists')
    return this.prisma.contract.create({
      data: { ...dto, isActive: dto.isActive ?? true },
    })
  }

  async update(id: string, dto: UpdateContractDto) {
    await this.findOne(id)
    if (dto.code) {
      const existing = await this.prisma.contract.findFirst({
        where: { code: dto.code, NOT: { id } },
      })
      if (existing) throw new ConflictException('Contract code already exists')
    }
    return this.prisma.contract.update({ where: { id }, data: dto })
  }

  async delete(id: string) {
    await this.findOne(id)
    try {
      await this.prisma.contract.delete({ where: { id } })
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'P2003' || code === 'P2014') {
        throw new ConflictException('Cannot delete this contract because it has linked invoices')
      }
      throw e
    }
  }
}
