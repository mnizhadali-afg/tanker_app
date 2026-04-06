import {
  IsOptional, IsUUID, IsString, IsEnum, IsNumber, IsDateString,
  Min, IsArray, ValidateNested,
} from 'class-validator'
import { Type } from 'class-transformer'
import { TonnageBasis } from '@prisma/client'

export class BatchSaveTankerItemDto {
  @IsOptional() @IsUUID() id?: string

  @IsOptional() @IsUUID() portId?: string
  @IsOptional() @IsUUID() producerId?: string
  @IsOptional() @IsUUID() licenseId?: string

  @IsOptional() @IsString()     tankerNumber?: string
  @IsOptional() @IsDateString() entryDate?: string

  @IsOptional() @IsNumber() @Min(0) productWeight?: number
  @IsOptional() @IsNumber() @Min(0) billWeight?: number
  @IsOptional() @IsEnum(TonnageBasis) tonnageBasis?: TonnageBasis
  @IsOptional() @IsNumber() @Min(0) exchangeRate?: number

  @IsOptional() @IsNumber() @Min(0) costProduct?: number
  @IsOptional() @IsNumber() @Min(0) costPublicBenefits?: number
  @IsOptional() @IsNumber() @Min(0) costFmn60?: number
  @IsOptional() @IsNumber() @Min(0) costFmn20?: number
  @IsOptional() @IsNumber() @Min(0) costQualityControl?: number

  @IsOptional() @IsNumber() @Min(0) costDozbalagh_customer?: number
  @IsOptional() @IsNumber() @Min(0) costDozbalagh_producer?: number
  @IsOptional() @IsNumber() @Min(0) costEscort_customer?: number
  @IsOptional() @IsNumber() @Min(0) costEscort_producer?: number
  @IsOptional() @IsNumber() @Min(0) costBascule_customer?: number
  @IsOptional() @IsNumber() @Min(0) costBascule_producer?: number
  @IsOptional() @IsNumber() @Min(0) costOvernight_customer?: number
  @IsOptional() @IsNumber() @Min(0) costOvernight_producer?: number
  @IsOptional() @IsNumber() @Min(0) costBankCommission_customer?: number
  @IsOptional() @IsNumber() @Min(0) costBankCommission_producer?: number
  @IsOptional() @IsNumber() @Min(0) costRentAfn_customer?: number
  @IsOptional() @IsNumber() @Min(0) costRentAfn_producer?: number
  @IsOptional() @IsNumber() @Min(0) costMiscAfn_customer?: number
  @IsOptional() @IsNumber() @Min(0) costMiscAfn_producer?: number
  @IsOptional() @IsNumber() @Min(0) costBrokerCommission_customer?: number
  @IsOptional() @IsNumber() @Min(0) costBrokerCommission_producer?: number
  @IsOptional() @IsNumber() @Min(0) costExchangerCommission_customer?: number
  @IsOptional() @IsNumber() @Min(0) costExchangerCommission_producer?: number

  @IsOptional() @IsNumber() @Min(0) costLicenseCommission_customer?: number
  @IsOptional() @IsNumber() @Min(0) costLicenseCommission_producer?: number
  @IsOptional() @IsNumber() @Min(0) costRentUsd_customer?: number
  @IsOptional() @IsNumber() @Min(0) costRentUsd_producer?: number
  @IsOptional() @IsNumber() @Min(0) costMiscUsd_customer?: number
  @IsOptional() @IsNumber() @Min(0) costMiscUsd_producer?: number

  @IsOptional() @IsNumber() @Min(0) transportCost?: number
  @IsOptional() @IsNumber() @Min(0) commodityPercentDebt?: number
  @IsOptional() @IsNumber() @Min(0) ratePerTonAfn?: number
  @IsOptional() @IsNumber() @Min(0) ratePerTonUsd?: number
}

export class BatchSaveTankersBodyDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BatchSaveTankerItemDto)
  rows: BatchSaveTankerItemDto[]
}
