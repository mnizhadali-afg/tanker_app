import { IsString, IsUUID, IsEnum, IsOptional, IsBoolean, IsNumber } from 'class-validator'
import { CalculationType } from '@prisma/client'

export class CreateContractDto {
  @IsString()
  code: string

  @IsUUID()
  customerId: string

  @IsUUID()
  productId: string

  @IsEnum(CalculationType)
  calculationType: CalculationType

  @IsOptional()
  @IsNumber()
  defaultRatePerTonAfn?: number

  @IsOptional()
  @IsNumber()
  defaultRatePerTonUsd?: number

  @IsOptional()
  @IsNumber()
  defaultExchangeRate?: number

  @IsOptional()
  otherDefaultCosts?: Record<string, number>

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
