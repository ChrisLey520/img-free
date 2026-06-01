import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Replicate from 'replicate';
import sharp from 'sharp';
import axios from 'axios';

// 默认模型：SDXL img2img，效果稳定；可通过 REPLICATE_SPRITE_MODEL 覆盖
const DEFAULT_MODEL = 'stability-ai/sdxl:39ed52f2319f9c048d3054f925b6ccde6f6e9fddebb3d8a2cb09aac5fdb7e74f';

const ACTION_FRAME_HINTS: Record<string, string[]> = {
  walk:   ['left foot forward, mid stride',   'both feet together, upright',  'right foot forward, mid stride', 'both feet together, upright'],
  run:    ['left foot back, leaning forward', 'airborne, body extended',       'right foot back, leaning forward','airborne, body extended'],
  idle:   ['standing upright, neutral pose',  'slight head tilt right',        'standing upright, slight sway',   'slight head tilt left'],
  jump:   ['knees bent, crouch before jump',  'jumping, arms raised up high',  'peak height, body fully extended','landing, knees bent absorbing impact'],
  attack: ['weapon raised, ready to strike',  'swinging weapon forward',       'full extension of attack',        'recoiling back to guard'],
  hurt:   ['flinching back, arms raised',     'stumbling backwards',           'recovering balance',              'returning to idle stance'],
  death:  ['staggering forward, losing balance','falling to knees',            'slumping to the ground',          'lying flat, motionless'],
};

const SHARPEN_SIGMA: Record<number, number> = { 32: 1.6, 64: 1.2, 128: 0.8 };

export interface GenerateRequest {
  imageBuffer: Buffer;
  characterDesc: string;
  action: string;
  frameCount: number;
  cellW: number;
  cellH: number;
  style: 'pixel' | 'smooth';
}

@Injectable()
export class AiSpriteService {
  private readonly logger = new Logger(AiSpriteService.name);
  private readonly replicate: Replicate;
  private readonly model: string;

  constructor() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) {
      this.logger.warn('REPLICATE_API_TOKEN not set — AI sprite generation will be unavailable');
    }
    this.replicate = new Replicate({ auth: token ?? '' });
    this.model = process.env.REPLICATE_SPRITE_MODEL ?? DEFAULT_MODEL;
  }

  private get isConfigured() {
    return !!process.env.REPLICATE_API_TOKEN;
  }

  /** 根据动作关键词选取帧提示语（支持中英文动作名） */
  private getFrameHints(action: string, count: number): string[] {
    const normalized = action.toLowerCase().trim();
    const keyMap: Record<string, string> = {
      '行走': 'walk', '走路': 'walk', 'walking': 'walk', 'walk': 'walk',
      '奔跑': 'run', '跑步': 'run', 'running': 'run', 'run': 'run',
      '待机': 'idle', '站立': 'idle', 'idle': 'idle', 'standing': 'idle',
      '跳跃': 'jump', 'jumping': 'jump', 'jump': 'jump',
      '攻击': 'attack', 'attacking': 'attack', 'attack': 'attack',
      '受伤': 'hurt', 'hurt': 'hurt', 'hit': 'hurt',
      '死亡': 'death', '倒下': 'death', 'death': 'death', 'die': 'death',
    };
    const key = keyMap[normalized] ?? 'idle';
    const hints = ACTION_FRAME_HINTS[key] ?? ACTION_FRAME_HINTS['idle'];

    const result: string[] = [];
    for (let i = 0; i < count; i++) {
      result.push(hints[i % hints.length]);
    }
    return result;
  }

  private buildPrompt(characterDesc: string, action: string, frameHint: string, frameIdx: number, total: number): string {
    const pixelTag = 'pixel art game sprite, 8-bit retro style, clean pixel lines,';
    const baseChar = characterDesc.trim() || 'game character';
    return `${pixelTag} ${baseChar}, ${action} animation frame ${frameIdx + 1} of ${total}, ${frameHint}, white background, centered, game-ready sprite, consistent character design`;
  }

  private buildNegativePrompt(): string {
    return 'blurry, low quality, realistic photo, 3D render, multiple characters, text, watermark, extra limbs, deformed, ugly, low resolution, noise';
  }

  private async runReplicate(imageDataUrl: string, prompt: string): Promise<Buffer> {
    const output = await this.replicate.run(this.model as `${string}/${string}:${string}`, {
      input: {
        image: imageDataUrl,
        prompt,
        negative_prompt: this.buildNegativePrompt(),
        prompt_strength: 0.55,   // 低强度保持角色外貌
        num_inference_steps: 25,
        guidance_scale: 7.5,
        width: 512,
        height: 512,
      },
    });

    // Replicate 返回 URL 数组或 ReadableStream 数组
    const outputs = Array.isArray(output) ? output : [output];
    if (!outputs[0]) throw new Error('Replicate returned empty output');

    const first = outputs[0];
    if (typeof first === 'string' && first.startsWith('http')) {
      const resp = await axios.get<ArrayBuffer>(first, { responseType: 'arraybuffer' });
      return Buffer.from(resp.data);
    }
    // ReadableStream (Replicate Node SDK v1)
    const chunks: Uint8Array[] = [];
    for await (const chunk of first as AsyncIterable<Uint8Array>) {
      chunks.push(chunk);
    }
    return Buffer.concat(chunks);
  }

  private async pixelify(buf: Buffer, cellW: number, cellH: number, style: 'pixel' | 'smooth'): Promise<Buffer> {
    const sigma = SHARPEN_SIGMA[cellH] ?? 1.2;
    const enhanced = await sharp(buf, { failOn: 'none' })
      .normalize()
      .clahe({ width: 64, height: 64, maxSlope: 3 })
      .sharpen({ sigma })
      .modulate({ saturation: 1.2 })
      .png()
      .toBuffer();

    // inside-fit → 透明背景画布
    const resized = await sharp(enhanced)
      .ensureAlpha()
      .resize({ width: cellW, height: cellH, fit: 'inside', kernel: 'lanczos3' })
      .png()
      .toBuffer();

    const meta = await sharp(resized).metadata();
    const iw = meta.width ?? 0;
    const ih = meta.height ?? 0;
    const left = Math.max(0, Math.floor((cellW - iw) / 2));
    const top  = Math.max(0, Math.floor((cellH - ih) / 2));

    const cell = await sharp({
      create: { width: cellW, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: resized, left, top }])
      .png(style === 'pixel' ? { palette: true, colors: 64, dither: 1.0 } : {})
      .toBuffer();

    return cell;
  }

  async generate(req: GenerateRequest) {
    if (!this.isConfigured) {
      throw new BadRequestException('REPLICATE_API_TOKEN not configured. Please set it in environment variables.');
    }

    const { imageBuffer, characterDesc, action, frameCount, cellW, cellH, style } = req;
    const count = Math.max(1, Math.min(8, frameCount));

    // Base64 data URL for Replicate
    const imageDataUrl = `data:image/png;base64,${
      (await sharp(imageBuffer, { failOn: 'none' }).png().toBuffer()).toString('base64')
    }`;

    const frameHints = this.getFrameHints(action, count);

    this.logger.log(`Generating ${count} frames for action "${action}"`);

    // 并行生成所有帧
    const rawFrames = await Promise.all(
      frameHints.map((hint, i) => {
        const prompt = this.buildPrompt(characterDesc, action, hint, i, count);
        this.logger.debug(`Frame ${i + 1} prompt: ${prompt}`);
        return this.runReplicate(imageDataUrl, prompt);
      }),
    );

    // 像素化后处理
    const frames = await Promise.all(
      rawFrames.map((buf) => this.pixelify(buf, cellW, cellH, style)),
    );

    return {
      frames: frames.map((buf) => `data:image/png;base64,${buf.toString('base64')}`),
      frameCount: frames.length,
      cellW,
      cellH,
    };
  }
}
