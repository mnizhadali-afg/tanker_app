import { Module } from '@nestjs/common'
import { TankersController } from './tankers.controller'
import { TankersService } from './tankers.service'
import { InvoicesModule } from '../invoices/invoices.module'

@Module({
  imports: [InvoicesModule],
  controllers: [TankersController],
  providers: [TankersService],
})
export class TankersModule {}
