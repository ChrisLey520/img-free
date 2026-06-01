import { Body, Controller, Logger, Post } from '@nestjs/common';
import * as crypto from 'node:crypto';
import { PddService } from './pdd.service.js';
import { RedemptionService } from '../redemption/redemption.service.js';

@Controller('pdd')
export class PddController {
  private readonly logger = new Logger(PddController.name);
  private readonly appSecret = process.env.PINDUODUO_APP_SECRET;
  private readonly redeemBaseUrl = process.env.REDEEM_BASE_URL ?? 'http://localhost:3000';

  constructor(
    private readonly pdd: PddService,
    private readonly redemption: RedemptionService,
  ) {}

  @Post('webhook')
  async webhook(@Body() body: Record<string, unknown>) {
    if (!this.appSecret) return { ok: false };
    const { sign, ...rest } = body as Record<string, string>;
    const sorted = Object.keys(rest)
      .sort()
      .map((k) => `${k}${rest[k]}`)
      .join('');
    const expected = crypto
      .createHash('md5')
      .update(this.appSecret + sorted + this.appSecret)
      .digest('hex')
      .toUpperCase();
    if (sign !== expected) return { ok: false };

    const orderSn = rest['order_sn'] as string;
    if (!orderSn) return { ok: true };

    const [code] = await this.redemption.generateCodes(1, orderSn);
    const message =
      `您好！感谢您的购买 🎨\n` +
      `您的像素头像制作码是：${code.code}\n` +
      `请访问 ${this.redeemBaseUrl}/redeem 输入兑换码开始制作，3天内有效。`;
    await this.pdd.sendMessage(orderSn, message);
    this.logger.log(`Webhook: code ${code.code} generated for order ${orderSn}`);
    return { ok: true };
  }
}
