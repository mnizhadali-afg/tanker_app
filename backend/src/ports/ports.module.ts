import { Module } from '@nestjs/common'
import { PortsController } from './ports.controller'
import { PortsService } from './ports.service'

@Module({
  controllers: [PortsController],
  providers: [PortsService],
  exports: [PortsService],
})
export class PortsModule {}
