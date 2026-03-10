import { Injectable, ConflictException, NotFoundException } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { PrismaService } from '../prisma/prisma.service'
import { CreateUserDto } from './dto/create-user.dto'
import { UpdateUserDto } from './dto/update-user.dto'

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      select: { id: true, username: true, role: true, isActive: true, createdAt: true },
      orderBy: { createdAt: 'desc' },
    })
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true },
    })
    if (!user) throw new NotFoundException('User not found')
    return user
  }

  async create(dto: CreateUserDto) {
    const existing = await this.prisma.user.findUnique({ where: { username: dto.username } })
    if (existing) throw new ConflictException('Username already taken')

    const passwordHash = await bcrypt.hash(dto.password, 12)
    const user = await this.prisma.user.create({
      data: { username: dto.username, passwordHash, role: dto.role, isActive: dto.isActive ?? true },
      select: { id: true, username: true, role: true, isActive: true, createdAt: true },
    })
    return user
  }

  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id)
    const data: Record<string, unknown> = {}
    if (dto.password) data.passwordHash = await bcrypt.hash(dto.password, 12)
    if (dto.role !== undefined) data.role = dto.role
    if (dto.isActive !== undefined) data.isActive = dto.isActive

    return this.prisma.user.update({
      where: { id },
      data,
      select: { id: true, username: true, role: true, isActive: true, updatedAt: true },
    })
  }
}
