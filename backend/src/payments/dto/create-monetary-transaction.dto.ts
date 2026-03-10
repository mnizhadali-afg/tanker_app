import { IsEnum, IsUUID, IsNumber, IsDateString, IsOptional, IsString, Min, ValidateIf } from 'class-validator'
import { TransactionType, PaymentLevel } from '@prisma/client'

export class CreateMonetaryTransactionDto {
  @IsEnum(TransactionType)
  type: TransactionType

  @IsOptional()
  @IsUUID()
  payerAccountId?: string

  @IsOptional()
  @IsUUID()
  payeeAccountId?: string

  @IsOptional()
  @IsUUID()
  monetaryAccountId?: string

  @IsEnum(PaymentLevel)
  linkedLevel: PaymentLevel

  @IsOptional()
  @IsUUID()
  customerId?: string

  @IsOptional()
  @IsUUID()
  contractId?: string

  @IsOptional()
  @IsUUID()
  invoiceId?: string

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountAfn?: number

  @IsOptional()
  @IsNumber()
  @Min(0)
  amountUsd?: number

  @ValidateIf((o) => o.type === 'exchange')
  @IsNumber()
  @Min(0)
  exchangeRate?: number

  @IsDateString()
  transactionDate: string

  @IsOptional()
  @IsString()
  notes?: string
}
