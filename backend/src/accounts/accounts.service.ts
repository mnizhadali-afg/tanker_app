import { Injectable, NotFoundException } from '@nestjs/common'
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

  async deactivate(id: string) {
    await this.findOne(id)
    return this.prisma.account.update({ where: { id }, data: { isActive: false } })
  }
}
