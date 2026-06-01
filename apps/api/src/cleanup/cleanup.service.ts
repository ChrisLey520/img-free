import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { RedemptionService } from '../redemption/redemption.service.js';

@Injectable()
export class CleanupService {
  private readonly logger = new Logger(CleanupService.name);

  constructor(private readonly redemptionService: RedemptionService) {}

  @Cron(CronExpression.EVERY_DAY_AT_3AM)
  async cleanupExpired() {
    const count = await this.redemptionService.deleteExpired();
    this.logger.log(`Cleanup: removed ${count} expired result(s)`);
  }
}
