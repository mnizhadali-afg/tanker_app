import { IsString, IsEnum, IsOptional, IsBoolean } from 'class-validator'
import { AccountType } from '@prisma/client'

export class CreateAccountDto {
  @IsString()
  name: string

  @IsEnum(AccountType)
  type: AccountType

  @IsOptional()
  @IsString()
  phone?: string

  @IsOptional()
  @IsString()
  address?: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
