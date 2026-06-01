import { Module } from '@nestjs/common';
import { RedemptionController } from './redemption.controller.js';
import { RedemptionService } from './redemption.service.js';
import { StorageModule } from '../storage/storage.module.js';
import { ConvertModule } from '../convert/convert.module.js';

@Module({
  imports: [StorageModule, ConvertModule],
  controllers: [RedemptionController],
  providers: [RedemptionService],
  exports: [RedemptionService],
})
export class RedemptionModule {}
