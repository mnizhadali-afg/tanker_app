import { IsOptional, IsEnum, IsUUID, IsDateString } from 'class-validator'
import { InvoiceStatus } from '@prisma/client'

export class InvoiceFilterDto {
  @IsOptional()
  @IsEnum(InvoiceStatus)
  status?: InvoiceStatus

  @IsOptional()
  @IsUUID()
  customerId?: string

  @IsOptional()
  @IsUUID()
  contractId?: string

  @IsOptional()
  @IsDateString()
  dateFrom?: string

  @IsOptional()
  @IsDateString()
  dateTo?: string
}
