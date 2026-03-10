import { IsString, MinLength, IsEnum, IsOptional, IsBoolean } from 'class-validator'
import { UserRole } from '@prisma/client'

export class CreateUserDto {
  @IsString()
  username: string

  @IsString()
  @MinLength(6)
  password: string

  @IsEnum(UserRole)
  role: UserRole

  @IsOptional()
  @IsBoolean()
  isActive?: boolean
}
