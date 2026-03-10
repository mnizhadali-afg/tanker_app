import { Module } from '@nestjs/common'
import { ConfigModule } from '@nestjs/config'
import { ThrottlerModule } from '@nestjs/throttler'
import { PrismaModule } from './prisma/prisma.module'
import { AuthModule } from './auth/auth.module'
import { UsersModule } from './users/users.module'
import { AccountsModule } from './accounts/accounts.module'
import { ProductsModule } from './products/products.module'
import { PortsModule } from './ports/ports.module'
import { LicensesModule } from './licenses/licenses.module'
import { ContractsModule } from './contracts/contracts.module'
import { InvoicesModule } from './invoices/invoices.module'
import { TankersModule } from './tankers/tankers.module'
import { PaymentsModule } from './payments/payments.module'
import { ReportsModule } from './reports/reports.module'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    PrismaModule,
    AuthModule,
    UsersModule,
    AccountsModule,
    ProductsModule,
    PortsModule,
    LicensesModule,
    ContractsModule,
    InvoicesModule,
    TankersModule,
    PaymentsModule,
    ReportsModule,
  ],
})
export class AppModule {}
