import { Module } from '@nestjs/common';
import { PddService } from './pdd.service.js';
import { PddPoller } from './pdd.poller.js';
import { PddController } from './pdd.controller.js';
import { RedemptionModule } from '../redemption/redemption.module.js';

@Module({
  imports: [RedemptionModule],
  controllers: [PddController],
  providers: [PddService, PddPoller],
})
export class PddModule {}
