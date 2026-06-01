import { Injectable, Logger } from '@nestjs/common';
import axios from 'axios';
import * as crypto from 'node:crypto';

const PDD_API = 'https://gw-api.pinduoduo.com/api/router';

export interface PddOrderItem {
  order_sn: string;
  goods_name: string;
  receiver_name: string;
}

@Injectable()
export class PddService {
  private readonly logger = new Logger(PddService.name);
  private readonly appId = process.env.PINDUODUO_APP_ID;
  private readonly appSecret = process.env.PINDUODUO_APP_SECRET;
  private readonly accessToken = process.env.PINDUODUO_ACCESS_TOKEN;

  get isEnabled(): boolean {
    return !!(this.appId && this.appSecret && this.accessToken);
  }

  private sign(params: Record<string, string>): string {
    const sorted = Object.keys(params)
      .sort()
      .map((k) => `${k}${params[k]}`)
      .join('');
    const raw = this.appSecret + sorted + this.appSecret;
    return crypto.createHash('md5').update(raw).digest('hex').toUpperCase();
  }

  private async call(type: string, extra: Record<string, string>): Promise<unknown> {
    const params: Record<string, string> = {
      type,
      client_id: this.appId!,
      timestamp: String(Math.floor(Date.now() / 1000)),
      data_type: 'JSON',
      access_token: this.accessToken!,
      ...extra,
    };
    params.sign = this.sign(params);
    const res = await axios.post(PDD_API, new URLSearchParams(params).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      timeout: 10_000,
    });
    return res.data;
  }

  async fetchNewOrders(startTime: number, endTime: number): Promise<PddOrderItem[]> {
    if (!this.isEnabled) return [];
    try {
      const data = (await this.call('pdd.order.number.list.get', {
        start_time: String(startTime),
        end_time: String(endTime),
        page: '1',
        page_size: '100',
      })) as { order_sn_list?: PddOrderItem[] };
      return data?.order_sn_list ?? [];
    } catch (e) {
      this.logger.error(`Failed to fetch orders: ${(e as Error).message}`);
      return [];
    }
  }

  async sendMessage(orderSn: string, message: string): Promise<boolean> {
    if (!this.isEnabled) return false;
    try {
      await this.call('pdd.logistics.cs.message.send', {
        order_sn: orderSn,
        content: message,
      });
      return true;
    } catch (e) {
      this.logger.error(`Failed to send message for ${orderSn}: ${(e as Error).message}`);
      return false;
    }
  }
}
