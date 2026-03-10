import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { ContractsService } from './contracts.service'
import { CreateContractDto } from './dto/create-contract.dto'
import { UpdateContractDto } from './dto/update-contract.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('contracts')
@UseGuards(JwtAuthGuard)
export class ContractsController {
  constructor(private contractsService: ContractsService) {}

  @Get()
  findAll(@Query('customerId') customerId?: string, @Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined
    return this.contractsService.findAll(customerId, active)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id)
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  create(@Body() dto: CreateContractDto) {
    return this.contractsService.create(dto)
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  update(@Param('id') id: string, @Body() dto: UpdateContractDto) {
    return this.contractsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  deactivate(@Param('id') id: string) {
    return this.contractsService.deactivate(id)
  }
}
