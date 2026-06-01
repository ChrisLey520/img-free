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

export const PIXEL_PRESETS = {
  mini: { width: 32, height: 32 },
  standard: { width: 64, height: 64 },
  hd: { width: 128, height: 128 },
} as const;

export type PresetKey = keyof typeof PIXEL_PRESETS;
export type StyleKey = 'natural' | 'retro';

/** 目标尺寸越小，缩放损失越大，锐化要更强 */
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
        return { valid: false, reason: 'used_has_result', expiresAt: record.expiresAt };
      }
      return { valid: false, reason: 'used' };
    }
    if (record.status === 'EXPIRED') return { valid: false, reason: 'expired' };
    return { valid: true };
  }

  async redeem(code: string, imageBuffer: Buffer, filename: string, preset: PresetKey, style: StyleKey = 'natural') {
    const record = await this.db.redemptionCode.findUnique({ where: { code } });
    if (!record) throw new NotFoundException('制作码不存在');
    if (record.status === 'USED') {
      const resultExists = await this.storage.exists(code);
      if (resultExists && record.expiresAt && record.expiresAt > new Date()) {
        const buf = await this.storage.read(code);
        return {
          alreadyDone: true,
          expiresAt: record.expiresAt,
          previewDataUrl: `data:image/png;base64,${buf!.toString('base64')}`,
        };
      }
      throw new BadRequestException('制作码已使用');
    }
    if (record.status === 'EXPIRED') throw new ForbiddenException('制作码已过期');

    const { width, height } = PIXEL_PRESETS[preset];

    // 前处理：
    //   1. normalize   — 自动曝光校正，把最暗/最亮拉到全范围
    //   2. clahe       — 局部对比度增强，改善脸部受光不均
    //   3. sharpen     — 按目标尺寸自适应锐化，保留缩小前的边缘细节
    //   4. modulate    — 轻微提升饱和度，让颜色更鲜艳
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
        // retro 风格：限 64 色 + Floyd-Steinberg 抖动
        ...(style === 'retro' ? { paletteColors: 64 } : {}),
      },
    });

    const outputUrl = result.output.dataUrl;
    const base64 = outputUrl.replace(/^data:image\/png;base64,/, '');
    const outputBuf = Buffer.from(base64, 'base64');

    await this.storage.save(code, outputBuf);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + RESULT_TTL_MS);
    await this.db.redemptionCode.update({
      where: { code },
      data: { status: 'USED', usedAt: now, expiresAt },
    });

    return {
      alreadyDone: false,
      expiresAt,
      previewDataUrl: result.output.previewDataUrl,
      inputPreviewDataUrl: result.input.previewDataUrl,
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
      where: {
        status: 'USED',
        expiresAt: { lt: new Date() },
      },
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
