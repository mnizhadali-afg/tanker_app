import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common'
import { ReportsService } from './reports.service'
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('customer-balances')
  customerBalances() {
    return this.reportsService.customerBalances()
  }

  @Get('dashboard')
  dashboard() {
    return this.reportsService.dashboard()
  }

  @Get('customer-balance/:customerId')
  customerBalance(@Param('customerId') customerId: string) {
    return this.reportsService.customerBalance(customerId)
  }

  @Get('invoice-status')
  invoiceStatus(
    @Query('customerId') customerId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.invoiceStatus(customerId, dateFrom, dateTo)
  }

  @Get('transactions')
  transactionHistory(
    @Query('customerId') customerId?: string,
    @Query('invoiceId') invoiceId?: string,
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ) {
    return this.reportsService.transactionHistory(customerId, invoiceId, dateFrom, dateTo)
  }
}
