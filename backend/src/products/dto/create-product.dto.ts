import { IsString, IsOptional, IsBoolean } from 'class-validator'

export class CreateProductDto {
  @IsString()
  name: string

  @IsString()
  unit: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
