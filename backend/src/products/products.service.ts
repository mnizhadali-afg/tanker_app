import { Injectable, NotFoundException } from '@nestjs/common'
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

  create(dto: CreateProductDto) {
    return this.prisma.product.create({ data: { ...dto, isActive: dto.isActive ?? true } })
  }

  async update(id: string, dto: UpdateProductDto) {
    await this.findOne(id)
    return this.prisma.product.update({ where: { id }, data: dto })
  }

  async deactivate(id: string) {
    await this.findOne(id)
    return this.prisma.product.update({ where: { id }, data: { isActive: false } })
  }
}
