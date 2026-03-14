import { Injectable, NotFoundException, ConflictException } from '@nestjs/common'
import { PrismaService } from '../prisma/prisma.service'
import { CreateProductDto } from './dto/create-product.dto'
import { UpdateProductDto } from './dto/update-product.dto'

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  findAll(isActive?: boolean) {
    return this.prisma.product.findMany({
      where: isActive !== undefined ? { isActive } : {},
      orderBy: { name: 'asc' },
    })
  }

  async findOne(id: string) {
    const product = await this.prisma.product.findUnique({ where: { id } })
    if (!product) throw new NotFoundException('Product not found')
    return product
  }

  async create(dto: CreateProductDto) {
    const existing = await this.prisma.product.findUnique({ where: { name: dto.name } })
    if (existing) throw new ConflictException(`Product name "${dto.name}" already exists`)
    return this.prisma.product.create({ data: { ...dto, isActive: dto.isActive ?? true } })
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id)
    if (dto.name) {
      const existing = await this.prisma.product.findFirst({ where: { name: dto.name, NOT: { id } } })
      if (existing) throw new ConflictException(`Product name "${dto.name}" already exists`)
    }
    return this.prisma.product.update({ where: { id }, data: dto })
  }

  async delete(id: string) {
    await this.findOne(id)
    try {
      await this.prisma.product.delete({ where: { id } })
    } catch (e: unknown) {
      const code = (e as { code?: string })?.code
      if (code === 'P2003' || code === 'P2014') {
        throw new ConflictException('Cannot delete this product because it has linked contracts or licenses')
      }
      throw e
    }
  }
}
