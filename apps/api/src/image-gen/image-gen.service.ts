import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import OpenAI from 'openai';
import { toFile } from 'openai';

export type ImageModel = 'dall-e-2' | 'dall-e-3' | 'gpt-image-1' | 'gpt-image-2';
export type GenerateMode = 'text' | 'image';

export interface ImageGenRequest {
  mode: GenerateMode;
  model: ImageModel;
  prompt: string;
  n: number;
  size: string;
  quality?: string;
  imageBuffer?: Buffer;
  imageMime?: string;
}

const DALLE2_SIZES  = ['256x256', '512x512', '1024x1024'];
const LARGE_SIZES   = ['1024x1024', '1792x1024', '1024x1792'];

@Injectable()
export class ImageGenService {
  private readonly logger = new Logger(ImageGenService.name);
  private readonly client: OpenAI;

  constructor() {
    const key = process.env.OPENAI_API_KEY;
    if (!key) this.logger.warn('OPENAI_API_KEY not set — image generation unavailable');
    this.client = new OpenAI({ apiKey: key ?? '' });
  }

  get isConfigured() { return !!process.env.OPENAI_API_KEY; }

  private parseError(err: unknown): string {
    const msg = err instanceof Error ? err.message : String(err);
    if (/401|invalid.?api.?key|incorrect.?api.?key/i.test(msg))
      return 'OpenAI API Key 无效，请检查 OPENAI_API_KEY';
    if (/402|insufficient.?quota|exceeded.?quota/i.test(msg))
      return 'OpenAI 账户额度不足，请前往 platform.openai.com/billing 充值';
    if (/429|rate.?limit/i.test(msg))
      return 'OpenAI 请求频率超限，请稍后重试';
    if (/400/i.test(msg)) return `请求参数有误：${msg}`;
    return `生成失败：${msg}`;
  }

  private toDataUrl(b64: string, mime = 'image/png') {
    return `data:${mime};base64,${b64}`;
  }

  async generate(req: ImageGenRequest): Promise<{ images: string[] }> {
    if (!this.isConfigured) {
      throw new BadRequestException('OPENAI_API_KEY not configured. Add it to your environment variables.');
    }

    const { mode, model, prompt, n, size, quality, imageBuffer, imageMime } = req;
    const validSize = (model === 'dall-e-2' ? DALLE2_SIZES : LARGE_SIZES).includes(size)
      ? size
      : model === 'dall-e-2' ? '1024x1024' : '1024x1024';

    this.logger.log(`image-gen | mode=${mode} model=${model} n=${n} size=${validSize}`);

    try {
      if (mode === 'image') {
        if (!imageBuffer) throw new BadRequestException('图生图模式需要上传参考图片');
        if (model === 'dall-e-3') throw new BadRequestException('dall-e-3 不支持图生图，请切换到其他模型');

        const imageFile = await toFile(imageBuffer, 'reference.png', { type: imageMime ?? 'image/png' });
        const resp = await this.client.images.edit({
          model: model as 'dall-e-2' | 'gpt-image-1',
          image: imageFile,
          prompt,
          n,
          size: validSize as Parameters<typeof this.client.images.edit>[0]['size'],
          response_format: 'b64_json',
        });
        const images = (resp.data ?? []).map((d) => this.toDataUrl(d.b64_json ?? ''));
        return { images };
      }

      const genParams: Parameters<typeof this.client.images.generate>[0] = {
        model,
        prompt,
        n,
        size: validSize as Parameters<typeof this.client.images.generate>[0]['size'],
        response_format: 'b64_json',
      };
      if (quality && model !== 'dall-e-2') {
        (genParams as Record<string, unknown>).quality = quality;
      }
      const resp = await this.client.images.generate(genParams);
      const images = (resp.data ?? []).map((d) => this.toDataUrl(d.b64_json ?? ''));
      return { images };
    } catch (err) {
      if (err instanceof BadRequestException) throw err;
      this.logger.error('image-gen failed', err);
      throw new BadRequestException(this.parseError(err));
    }
  }
}
