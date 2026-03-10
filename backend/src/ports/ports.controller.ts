import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { PortsService } from './ports.service'
import { CreatePortDto } from './dto/create-port.dto'
import { UpdatePortDto } from './dto/update-port.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('ports')
@UseGuards(JwtAuthGuard)
export class PortsController {
  constructor(private portsService: PortsService) {}

  @Get()
  findAll(@Query('isActive') isActive?: string) {
    const active = isActive !== undefined ? isActive === 'true' : undefined
    return this.portsService.findAll(active)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.portsService.findOne(id)
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  create(@Body() dto: CreatePortDto) {
    return this.portsService.create(dto)
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  update(@Param('id') id: string, @Body() dto: UpdatePortDto) {
    return this.portsService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  deactivate(@Param('id') id: string) {
    return this.portsService.deactivate(id)
  }
}
