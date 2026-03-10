import { IsUUID, IsNumber, IsString, IsDateString, IsOptional, Min } from 'class-validator'

export class CreateCommodityTransactionDto {
  @IsUUID()
  customerId: string

  @IsOptional()
  @IsUUID()
  contractId?: string

  @IsOptional()
  @IsUUID()
  invoiceId?: string

  @IsUUID()
  productId: string

  @IsNumber()
  @Min(0)
  quantity: number

  @IsString()
  unit: string

  @IsDateString()
  transactionDate: string

  @IsOptional()
  @IsString()
  notes?: string
}
