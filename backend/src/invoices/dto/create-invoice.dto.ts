import { IsUUID, IsDateString, IsOptional, IsString } from 'class-validator'

export class CreateInvoiceDto {
  @IsUUID()
  contractId: string

  @IsOptional()
  @IsUUID()
  customerId?: string

  @IsDateString()
  issueDate: string

  @IsOptional()
  @IsString()
  notes?: string
}
