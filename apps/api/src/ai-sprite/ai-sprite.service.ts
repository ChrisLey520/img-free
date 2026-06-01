import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import Replicate from 'replicate';
import sharp from 'sharp';
import axios from 'axios';
import { getSkeletons, ACTION_KEY_MAP, type Skeleton } from './skeleton-poses.js';
import { renderOpenPose } from './openpose-render.js';

/** 默认 img2img 模型（可通过环境变量覆盖） */
const DEFAULT_IMG2IMG_MODEL =
  'stability-ai/sdxl:39ed52f2319f9c048d3054f925b6ccde6f6e9fddebb3d8a2cb09aac5fdb7e74f';

/** 默认 ControlNet OpenPose 模型（可通过环境变量覆盖） */
const DEFAULT_CONTROLNET_MODEL =
  'jagilley/controlnet-pose:0b558b6b3b77ea88e0d89eb96042699dc4eca25b26c33dff7cfab7b7eb98de3e';

const SHARPEN_SIGMA: Record<number, number> = { 32: 1.6, 64: 1.2, 128: 0.8 };

const ACTION_FRAME_HINTS: Record<string, string[]> = {
  walk:   ['left foot forward, mid stride',   'both feet together, upright',       'right foot forward, mid stride',  'both feet together, upright'],
  run:    ['left foot back, leaning forward', 'airborne, body fully extended',      'right foot back, leaning forward', 'airborne, body fully extended'],
  idle:   ['standing upright, neutral pose',  'slight breath in, chest expanded',   'standing upright, slight sway',   'slight breath out, relaxed'],
  jump:   ['knees bent, crouch',              'jumping, arms raised high',          'peak height, fully extended',     'landing, knees bent'],
  attack: ['weapon raised ready',             'swinging forward',                   'full extension of strike',        'recoiling to guard'],
  hurt:   ['flinching back, arms up',         'stumbling backwards',                'recovering balance',              'returning to idle'],
  death:  ['staggering, knees buckling',      'falling to knees',                   'slumping sideways',               'lying flat, motionless'],
};

export type PipelineMode = 'img2img' | 'controlnet';

export interface GenerateRequest {
  imageBuffer: Buffer;
  characterDesc: string;
  action: string;
  frameCount: number;
  cellW: number;
  cellH: number;
  style: 'pixel' | 'smooth';
  mode: PipelineMode;
}

@Injectable()
export class AiSpriteService {
  private readonly logger = new Logger(AiSpriteService.name);
  private readonly replicate: Replicate;
  private readonly img2imgModel: string;
  private readonly controlnetModel: string;

  constructor() {
    const token = process.env.REPLICATE_API_TOKEN;
    if (!token) this.logger.warn('REPLICATE_API_TOKEN not set — AI sprite generation unavailable');
    this.replicate = new Replicate({ auth: token ?? '' });
    this.img2imgModel = process.env.REPLICATE_SPRITE_MODEL ?? DEFAULT_IMG2IMG_MODEL;
    this.controlnetModel = process.env.REPLICATE_CONTROLNET_MODEL ?? DEFAULT_CONTROLNET_MODEL;
  }

  get isConfigured() { return !!process.env.REPLICATE_API_TOKEN; }

  // ── 公共工具 ──────────────────────────────────────────────────

  private getFrameHints(action: string, count: number): string[] {
    const key = ACTION_KEY_MAP[action.toLowerCase().trim()] ?? 'idle';
    const hints = ACTION_FRAME_HINTS[key] ?? ACTION_FRAME_HINTS['idle'];
    return Array.from({ length: count }, (_, i) => hints[i % hints.length]);
  }

  private buildPrompt(characterDesc: string, action: string, hint: string, idx: number, total: number) {
    const char = characterDesc.trim() || 'game character';
    return `pixel art game sprite, 8-bit retro style, ${char}, ${action} animation frame ${idx + 1} of ${total}, ${hint}, white background, centered, consistent character design, clean lines`;
  }

  private buildNegativePrompt() {
    return 'blurry, low quality, realistic photo, 3D, multiple characters, text, watermark, extra limbs, deformed, ugly';
  }

  private async downloadFromReplicate(output: unknown): Promise<Buffer> {
    const outputs = Array.isArray(output) ? output : [output];
    const first = outputs[0];
    if (!first) throw new Error('Replicate returned empty output');
    if (typeof first === 'string' && first.startsWith('http')) {
      const resp = await axios.get<ArrayBuffer>(first, { responseType: 'arraybuffer' });
      return Buffer.from(resp.data);
    }
    const chunks: Uint8Array[] = [];
    for await (const chunk of first as AsyncIterable<Uint8Array>) chunks.push(chunk);
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

    const resized = await sharp(enhanced)
      .ensureAlpha()
      .resize({ width: cellW, height: cellH, fit: 'inside', kernel: 'lanczos3' })
      .png()
      .toBuffer();

    const meta = await sharp(resized).metadata();
    const left = Math.max(0, Math.floor((cellW - (meta.width ?? 0)) / 2));
    const top  = Math.max(0, Math.floor((cellH - (meta.height ?? 0)) / 2));

    return sharp({
      create: { width: cellW, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite([{ input: resized, left, top }])
      .png(style === 'pixel' ? { palette: true, colors: 64, dither: 1.0 } : {})
      .toBuffer();
  }

  // ── img2img 管线 ──────────────────────────────────────────────

  private async generateImg2Img(
    imageDataUrl: string,
    prompt: string,
  ): Promise<Buffer> {
    const output = await this.replicate.run(this.img2imgModel as `${string}/${string}:${string}`, {
      input: {
        image: imageDataUrl,
        prompt,
        negative_prompt: this.buildNegativePrompt(),
        prompt_strength: 0.55,
        num_inference_steps: 25,
        guidance_scale: 7.5,
        width: 512,
        height: 512,
      },
    });
    return this.downloadFromReplicate(output);
  }

  // ── ControlNet 管线 ───────────────────────────────────────────

  /**
   * ControlNet + 骨骼绑定管线：
   * 1. 从预定义姿态库取出该动作/帧的骨骼坐标
   * 2. 渲染为 OpenPose 彩色 PNG（黑底，关节+肢体线）
   * 3. 以 OpenPose 图为 conditioning + 原角色图为 style reference 调用 ControlNet
   * 4. 返回生成图像
   */
  private async generateControlNet(
    skeleton: Skeleton,
    imageDataUrl: string,
    prompt: string,
  ): Promise<Buffer> {
    // 渲染 OpenPose 骨骼图（512×512）
    const poseImage = await renderOpenPose(skeleton, 512);
    const poseDataUrl = `data:image/png;base64,${poseImage.toString('base64')}`;

    const output = await this.replicate.run(
      this.controlnetModel as `${string}/${string}:${string}`,
      {
        input: {
          image:           poseDataUrl,   // OpenPose 骨骼图（conditioning）
          prompt,
          negative_prompt: this.buildNegativePrompt(),
          num_inference_steps: 20,
          guidance_scale: 9.0,
          controlnet_conditioning_scale: 1.0,
          // 用原图作为风格参考（部分 ControlNet 模型支持）
          init_image:     imageDataUrl,
          prompt_strength: 0.8,
        },
      },
    );
    return this.downloadFromReplicate(output);
  }

  // ── 主入口 ────────────────────────────────────────────────────

  async generate(req: GenerateRequest) {
    if (!this.isConfigured) {
      throw new BadRequestException(
        'REPLICATE_API_TOKEN not configured. Add it to your environment variables.',
      );
    }

    const { imageBuffer, characterDesc, action, frameCount, cellW, cellH, style, mode } = req;
    const count = Math.max(1, Math.min(8, frameCount));

    const imageDataUrl = `data:image/png;base64,${
      (await sharp(imageBuffer, { failOn: 'none' }).png().toBuffer()).toString('base64')
    }`;

    const frameHints = this.getFrameHints(action, count);
    const skeletons  = mode === 'controlnet' ? getSkeletons(action, count) : [];

    this.logger.log(`Generating ${count} frames | action="${action}" | mode=${mode}`);

    // 并行生成所有帧
    const rawFrames = await Promise.all(
      frameHints.map((hint, i) => {
        const prompt = this.buildPrompt(characterDesc, action, hint, i, count);
        if (mode === 'controlnet') {
          return this.generateControlNet(skeletons[i], imageDataUrl, prompt);
        }
        return this.generateImg2Img(imageDataUrl, prompt);
      }),
    );

    // 像素化后处理
    const frames = await Promise.all(
      rawFrames.map((buf) => this.pixelify(buf, cellW, cellH, style)),
    );

    // 同时返回 ControlNet 模式下的骨骼预览图（供 UI 展示）
    const posePreviewDataUrls: string[] = [];
    if (mode === 'controlnet') {
      for (const sk of skeletons) {
        const buf = await renderOpenPose(sk, 128);
        posePreviewDataUrls.push(`data:image/png;base64,${buf.toString('base64')}`);
      }
    }

    return {
      frames: frames.map((buf) => `data:image/png;base64,${buf.toString('base64')}`),
      posePreviewDataUrls,
      frameCount: frames.length,
      cellW,
      cellH,
      mode,
    };
  }
}
