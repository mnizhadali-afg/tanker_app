import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { AccountType } from '@prisma/client'
import { PrismaService } from '../prisma/prisma.service'
import { CreateAccountDto } from './dto/create-account.dto'
import { UpdateAccountDto } from './dto/update-account.dto'

@Injectable()
export class AccountsService {
  constructor(private prisma: PrismaService) {}

  findAll(type?: AccountType, isActive?: boolean) {
    return this.prisma.account.findMany({
      where: {
        ...(type ? { type } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string) {
    const account = await this.prisma.account.findUnique({ where: { id } })
    if (!account) throw new NotFoundException('Account not found')
    return account
  }

  create(dto: CreateAccountDto) {
    return this.prisma.account.create({ data: { ...dto, isActive: dto.isActive ?? true } })
  }

  async update(id: string, dto: UpdateAccountDto) {
    await this.findOne(id)
    return this.prisma.account.update({ where: { id }, data: dto })
  }

  async delete(id: string) {
    await this.findOne(id)
    try {
      await this.prisma.account.delete({ where: { id } })
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'P2003' || code === 'P2014') {
        throw new ConflictException('Cannot delete this account because it has linked contracts, invoices, or payments')
      }
      throw e
    }
  }
}
