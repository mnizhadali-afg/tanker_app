import { PartialType, OmitType } from '@nestjs/mapped-types'
import { CreateTankerDto } from './create-tanker.dto'

export class UpdateTankerDto extends PartialType(OmitType(CreateTankerDto, ['invoiceId', 'contractId'] as const)) {}
