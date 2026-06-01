import { Module } from '@nestjs/common';
import { CleanupService } from './cleanup.service.js';
import { RedemptionModule } from '../redemption/redemption.module.js';

@Module({
  imports: [RedemptionModule],
  providers: [CleanupService],
})
export class CleanupModule {}
