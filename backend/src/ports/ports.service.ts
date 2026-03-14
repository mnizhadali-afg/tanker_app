import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreatePortDto } from './dto/create-port.dto'
import { UpdatePortDto } from './dto/update-port.dto'

@Injectable()
export class PortsService {
  constructor(private prisma: PrismaService) {}

  findAll(isActive?: boolean) {
    return this.prisma.port.findMany({
      where: isActive !== undefined ? { isActive } : {},
      include: { producer: { select: { id: true, name: true } } },
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string) {
    const port = await this.prisma.port.findUnique({
      where: { id },
      include: { producer: { select: { id: true, name: true } } },
    })
    if (!port) throw new NotFoundException('Port not found')
    return port
  }

  async create(dto: CreatePortDto) {
    const producer = await this.prisma.account.findUnique({ where: { id: dto.producerId } })
    if (!producer || producer.type !== 'producer') {
      throw new BadRequestException('producerId must reference an account of type producer')
    }
    return this.prisma.port.create({ data: { ...dto, isActive: dto.isActive ?? true } })
  }

  async update(id: string, dto: UpdatePortDto) {
    await this.findOne(id)
    if (dto.producerId) {
      const producer = await this.prisma.account.findUnique({ where: { id: dto.producerId } })
      if (!producer || producer.type !== 'producer') {
        throw new BadRequestException('producerId must reference an account of type producer')
      }
    }
    return this.prisma.port.update({ where: { id }, data: dto })
  }

  async delete(id: string) {
    await this.findOne(id)
    try {
      await this.prisma.port.delete({ where: { id } })
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'P2003' || code === 'P2014') {
        throw new ConflictException('Cannot delete this port because it has linked tankers')
      }
      throw e
    }
  }
}
