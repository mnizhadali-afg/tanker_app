import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateLicenseDto } from './dto/create-license.dto'
import { UpdateLicenseDto } from './dto/update-license.dto'

@Injectable()
export class LicensesService {
  constructor(private prisma: PrismaService) {}

  findAll(producerId?: string, productId?: string, isActive?: boolean) {
    return this.prisma.license.findMany({
      where: {
        ...(producerId ? { producerId } : {}),
        ...(productId ? { productId } : {}),
        ...(isActive !== undefined ? { isActive } : {}),
      },
      include: {
        product: { select: { id: true, name: true } },
        producer: { select: { id: true, name: true } },
      },
      orderBy: { licenseNumber: 'asc' },
    })
  }

  async findOne(id: string) {
    const license = await this.prisma.license.findUnique({
      where: { id },
      include: {
        product: { select: { id: true, name: true } },
        producer: { select: { id: true, name: true } },
      },
    })
    if (!license) throw new NotFoundException('License not found')
    return license
  }

  create(dto: CreateLicenseDto) {
    return this.prisma.license.create({
      data: {
        ...dto,
        validFrom: new Date(dto.validFrom),
        validTo: new Date(dto.validTo),
        isActive: dto.isActive ?? true,
      },
    })
  }

  async update(id: string, dto: UpdateLicenseDto) {
    await this.findOne(id)
    const data: Record<string, unknown> = { ...dto }
    if (dto.validFrom) data.validFrom = new Date(dto.validFrom)
    if (dto.validTo) data.validTo = new Date(dto.validTo)
    return this.prisma.license.update({ where: { id }, data })
  }

  async delete(id: string) {
    await this.findOne(id)
    try {
      await this.prisma.license.delete({ where: { id } })
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'P2003' || code === 'P2014') {
        throw new ConflictException('Cannot delete this license because it has linked tankers')
      }
      throw e
    }
  }
}
