import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { TankersService } from './tankers.service'
import { CreateTankerDto } from './dto/create-tanker.dto'
import { UpdateTankerDto } from './dto/update-tanker.dto'
import { BatchSaveTankersBodyDto } from './dto/batch-save-tanker.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller()
@UseGuards(JwtAuthGuard)
export class TankersController {
  constructor(private tankersService: TankersService) {}

  @Get('invoices/:invoiceId/tankers')
  findByInvoice(@Param('invoiceId') invoiceId: string) {
    return this.tankersService.findByInvoice(invoiceId)
  }

  @Post('invoices/:invoiceId/tankers')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'data_entry')
  create(@Param('invoiceId') invoiceId: string, @Body() dto: CreateTankerDto) {
    return this.tankersService.create({ ...dto, invoiceId })
  }

  @Post('invoices/:invoiceId/tankers/bulk')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'data_entry')
  bulkCreate(@Param('invoiceId') invoiceId: string, @Body() dtos: CreateTankerDto[]) {
    return this.tankersService.bulkCreate(invoiceId, dtos)
  }

  @Post('invoices/:invoiceId/tankers/batch-save')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'data_entry')
  batchSave(@Param('invoiceId') invoiceId: string, @Body() body: BatchSaveTankersBodyDto) {
    return this.tankersService.batchSave(invoiceId, body)
  }

  @Get('tankers/:id')
  findOne(@Param('id') id: string) {
    return this.tankersService.findOne(id)
  }

  @Patch('tankers/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'data_entry')
  update(@Param('id') id: string, @Body() dto: UpdateTankerDto) {
    return this.tankersService.update(id, dto)
  }

  @Delete('tankers/:id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'data_entry')
  remove(@Param('id') id: string) {
    return this.tankersService.remove(id)
  }
}
