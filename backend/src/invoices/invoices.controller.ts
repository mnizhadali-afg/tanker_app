import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { InvoicesService } from './invoices.service'
import { CreateInvoiceDto } from './dto/create-invoice.dto'
import { InvoiceFilterDto } from './dto/invoice-filter.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtPayload } from '../auth/decorators/current-user.decorator'

@Controller('invoices')
@UseGuards(JwtAuthGuard)
export class InvoicesController {
  constructor(private invoicesService: InvoicesService) {}

  @Get()
  findAll(@Query() filter: InvoiceFilterDto) {
    return this.invoicesService.findAll(filter)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.invoicesService.findOne(id)
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'data_entry')
  create(@Body() dto: CreateInvoiceDto, @CurrentUser() user: JwtPayload) {
    return this.invoicesService.create(dto, user.sub)
  }

  @Patch(':id/finalize')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  finalize(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.invoicesService.finalize(id, user.sub)
  }

  @Patch(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  cancel(@Param('id') id: string, @CurrentUser() user: JwtPayload) {
    return this.invoicesService.cancel(id, user.sub)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  delete(@Param('id') id: string) {
    return this.invoicesService.delete(id)
  }
}
