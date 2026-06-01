import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { customAlphabet } from 'nanoid';
import sharp from 'sharp';
import { DatabaseService } from '../database/database.service.js';
import { StorageService } from '../storage/storage.service.js';
import { ConvertService } from '../convert/convert.service.js';

const ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
const nanoid = customAlphabet(ALPHABET, 12);

const RESULT_TTL_MS = 3 * 24 * 60 * 60 * 1000; // 3 days
const MAX_REMAKES = 3;

export const PIXEL_PRESETS = {
  mini: { width: 32, height: 32 },
  standard: { width: 64, height: 64 },
  hd: { width: 128, height: 128 },
} as const;

export type PresetKey = keyof typeof PIXEL_PRESETS;
export type StyleKey = 'natural' | 'retro';

const SHARPEN_SIGMA: Record<PresetKey, number> = {
  mini: 1.6,
  standard: 1.2,
  hd: 0.8,
};

@Injectable()
export class RedemptionService {
  constructor(
    private readonly db: DatabaseService,
    private readonly storage: StorageService,
    private readonly convertService: ConvertService,
  ) {}

  async generateCodes(count: number, pddOrderId?: string) {
    const created = [];
    for (let i = 0; i < count; i++) {
      const code = nanoid();
      const record = await this.db.redemptionCode.create({
        data: { code, pddOrderId },
      });
      created.push(record);
    }
    return created;
  }

  async listCodes() {
    return this.db.redemptionCode.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async validate(code: string) {
    const record = await this.db.redemptionCode.findUnique({ where: { code } });
    if (!record) return { valid: false, reason: 'not_found' };
    if (record.status === 'USED') {
      const resultExists = await this.storage.exists(code);
      if (resultExists && record.expiresAt && record.expiresAt > new Date()) {
        return {
          valid: false,
          reason: 'used_has_result',
          expiresAt: record.expiresAt,
          remakesRemaining: Math.max(0, MAX_REMAKES - record.remakesUsed),
        };
      }
      return { valid: false, reason: 'used' };
    }
    if (record.status === 'EXPIRED') return { valid: false, reason: 'expired' };
    return { valid: true };
  }

  private async generatePixelArt(
    imageBuffer: Buffer,
    filename: string,
    preset: PresetKey,
    style: StyleKey,
  ) {
    const { width, height } = PIXEL_PRESETS[preset];

    const enhanced = await sharp(imageBuffer, { failOn: 'none' })
      .normalize()
      .clahe({ width: 64, height: 64, maxSlope: 3 })
      .sharpen({ sigma: SHARPEN_SIGMA[preset] })
      .modulate({ saturation: 1.25 })
      .png()
      .toBuffer();

    const result = await this.convertService.convert(enhanced, filename, 'png', {
      sprite: {
        enabled: true,
        width,
        height,
        fit: 'inside',
        kernel: 'lanczos3',
        ...(style === 'retro' ? { paletteColors: 64 } : {}),
      },
    });

    const base64 = result.output.dataUrl.replace(/^data:image\/png;base64,/, '');
    const outputBuf = Buffer.from(base64, 'base64');

    return {
      previewDataUrl: result.output.previewDataUrl,
      inputPreviewDataUrl: result.input.previewDataUrl,
      outputBuf,
    };
  }

  async redeem(
    code: string,
    imageBuffer: Buffer,
    filename: string,
    preset: PresetKey,
    style: StyleKey = 'natural',
  ) {
    const record = await this.db.redemptionCode.findUnique({ where: { code } });
    if (!record) throw new NotFoundException('制作码不存在');

    if (record.status === 'EXPIRED') throw new ForbiddenException('制作码已过期');

    if (record.status === 'USED') {
      const remakesUsed = record.remakesUsed;

      // 还有重制次数 → 重新生成并覆盖存储
      if (remakesUsed < MAX_REMAKES) {
        const { previewDataUrl, inputPreviewDataUrl, outputBuf } =
          await this.generatePixelArt(imageBuffer, filename, preset, style);
        // 删除旧图再写入新图，避免旧文件残留占用空间
        await this.storage.delete(code);
        await this.storage.save(code, outputBuf);
        const newRemakesUsed = remakesUsed + 1;
        // 每次重制刷新 3 天有效期（以最后一张图片的生成时间为准）
        const remakeExpiresAt = new Date(Date.now() + RESULT_TTL_MS);
        await this.db.redemptionCode.update({
          where: { code },
          data: { remakesUsed: newRemakesUsed, expiresAt: remakeExpiresAt },
        });
        return {
          alreadyDone: false,
          remakesRemaining: MAX_REMAKES - newRemakesUsed,
          expiresAt: remakeExpiresAt,
          previewDataUrl,
          inputPreviewDataUrl,
        };
      }

      // 次数用完 → 返回已存储的图片
      const buf = await this.storage.read(code);
      if (buf && record.expiresAt && record.expiresAt > new Date()) {
        return {
          alreadyDone: true,
          remakesRemaining: 0,
          expiresAt: record.expiresAt,
          previewDataUrl: `data:image/png;base64,${buf.toString('base64')}`,
        };
      }
      throw new BadRequestException('制作码已过期');
    }

    // UNUSED → 首次生成
    const { previewDataUrl, inputPreviewDataUrl, outputBuf } =
      await this.generatePixelArt(imageBuffer, filename, preset, style);
    await this.storage.save(code, outputBuf);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESULT_TTL_MS);
    await this.db.redemptionCode.update({
      where: { code },
      data: { status: 'USED', usedAt: now, expiresAt, remakesUsed: 0 },
    });

    return {
      alreadyDone: false,
      remakesRemaining: MAX_REMAKES, // 首次生成后还有 3 次重制
      expiresAt,
      previewDataUrl,
      inputPreviewDataUrl,
    };
  }

  async getResult(code: string) {
    const record = await this.db.redemptionCode.findUnique({ where: { code } });
    if (!record || record.status !== 'USED') return null;
    if (record.expiresAt && record.expiresAt < new Date()) return null;
    return this.storage.read(code);
  }

  async deleteExpired() {
    const expired = await this.db.redemptionCode.findMany({
      where: { status: 'USED', expiresAt: { lt: new Date() } },
    });
    for (const r of expired) {
      await this.storage.delete(r.code);
      await this.db.redemptionCode.update({
        where: { id: r.id },
        data: { status: 'EXPIRED' },
      });
    }
    return expired.length;
  }
}
