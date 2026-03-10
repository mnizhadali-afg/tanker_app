import { Controller, Get, Post, Body, Query, UseGuards } from '@nestjs/common'
import { PaymentsService } from './payments.service'
import { CreateMonetaryTransactionDto } from './dto/create-monetary-transaction.dto'
import { CreateCommodityTransactionDto } from './dto/create-commodity-transaction.dto'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'
import { RolesGuard } from '../auth/guards/roles.guard'
import { Roles } from '../auth/decorators/roles.decorator'
import { CurrentUser } from '../auth/decorators/current-user.decorator'
import type { JwtPayload } from '../auth/decorators/current-user.decorator'

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private paymentsService: PaymentsService) {}

  @Get()
  findAll(
    @Query('customerId') customerId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('contractId') contractId?: string,
  ) {
    return this.paymentsService.findMonetary(customerId, invoiceId, contractId)
  }

  @Get('monetary')
  findMonetary(
    @Query('customerId') customerId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('contractId') contractId?: string,
  ) {
    return this.paymentsService.findMonetary(customerId, invoiceId, contractId)
  }

  @Get('commodity')
  findCommodity(@Query('customerId') customerId?: string) {
    return this.paymentsService.findCommodity(customerId)
  }

  @Post('monetary')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'data_entry')
  createMonetary(@Body() dto: CreateMonetaryTransactionDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.createMonetary(dto, user.sub)
  }

  @Post('commodity')
  @UseGuards(RolesGuard)
  @Roles('admin', 'accountant', 'data_entry')
  createCommodity(@Body() dto: CreateCommodityTransactionDto, @CurrentUser() user: JwtPayload) {
    return this.paymentsService.createCommodity(dto, user.sub)
  }
}
