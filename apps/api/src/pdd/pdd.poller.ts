import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PddService } from './pdd.service.js';
import { RedemptionService } from '../redemption/redemption.service.js';

const POLL_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

@Injectable()
export class PddPoller {
  private readonly logger = new Logger(PddPoller.name);
  private lastPolledAt = Math.floor((Date.now() - POLL_INTERVAL_MS) / 1000);
  private readonly redeemBaseUrl = process.env.REDEEM_BASE_URL ?? 'http://localhost:3000';

  constructor(
    private readonly pdd: PddService,
    private readonly redemption: RedemptionService,
  ) {}

  @Cron('*/5 * * * *')
  async pollOrders() {
    if (!this.pdd.isEnabled) {
      return;
    }

    const now = Math.floor(Date.now() / 1000);
    const orders = await this.pdd.fetchNewOrders(this.lastPolledAt, now);
    this.lastPolledAt = now;

    if (orders.length === 0) return;
    this.logger.log(`Found ${orders.length} new order(s) from Pinduoduo`);

    for (const order of orders) {
      const [code] = await this.redemption.generateCodes(1, order.order_sn);
      const message =
        `您好！感谢您的购买 🎨\n` +
        `您的像素头像制作码是：${code.code}\n` +
        `请访问 ${this.redeemBaseUrl}/redeem 输入兑换码开始制作，3天内有效。`;
      const sent = await this.pdd.sendMessage(order.order_sn, message);
      if (sent) {
        this.logger.log(`Sent code ${code.code} to order ${order.order_sn}`);
      } else {
        this.logger.warn(`Code ${code.code} generated but message send failed for order ${order.order_sn}`);
      }
    }
  }
}
