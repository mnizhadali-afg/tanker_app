import { IsString, IsUUID, IsOptional, IsBoolean } from 'class-validator'

export class CreatePortDto {
  @IsString()
  name: string

  @IsUUID()
  producerId: string

  @IsOptional()
  @IsString()
  notes?: string

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
