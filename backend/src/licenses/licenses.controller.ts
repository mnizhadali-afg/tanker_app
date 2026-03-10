import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { LicensesService } from './licenses.service'
import { CreateLicenseDto } from './dto/create-license.dto'
import { UpdateLicenseDto } from './dto/update-license.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'

@Controller('licenses')
@UseGuards(JwtAuthGuard)
export class LicensesController {
  constructor(private licensesService: LicensesService) {}

  @Get()
  findAll(
    @Query('producerId') producerId?: string,
    @Query('productId') productId?: string,
    @Query('isActive') isActive?: string,
  ) {
    const active = isActive !== undefined ? isActive === 'true' : undefined
    return this.licensesService.findAll(producerId, productId, active)
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.licensesService.findOne(id)
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  create(@Body() dto: CreateLicenseDto) {
    return this.licensesService.create(dto)
  }

  @Patch(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  update(@Param('id') id: string, @Body() dto: UpdateLicenseDto) {
    return this.licensesService.update(id, dto)
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant')
  deactivate(@Param('id') id: string) {
    return this.licensesService.deactivate(id)
  }
}
