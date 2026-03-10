import { IsString, IsUUID, IsDateString, IsOptional, IsBoolean } from 'class-validator'

export class CreateLicenseDto {
  @IsString()
  licenseNumber: string

  @IsUUID()
  productId: string

  @IsUUID()
  producerId: string

  @IsDateString()
  validFrom: string

  @IsDateString()
  validTo: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
