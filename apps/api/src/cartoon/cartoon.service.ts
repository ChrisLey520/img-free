import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import * as ort from 'onnxruntime-node';
import sharp from 'sharp';
import axios from 'axios';
import * as fs from 'fs';
import * as path from 'path';
const MODELS_DIR = path.resolve(__dirname, '../../../../models');
const MODEL_PATH = path.join(MODELS_DIR, 'cartoon.onnx');

// AnimeGANv2 Paprika style — float32 NHWC, range [-1, 1]
const DEFAULT_MODEL_URL =
  'https://huggingface.co/vumichien/AnimeGANv2_Paprika/resolve/main/AnimeGANv2_Paprika.onnx';

/** 向上取整到最近的 8 的倍数（AnimeGAN 要求） */
function alignTo8(n: number) { return Math.ceil(n / 8) * 8; }

@Injectable()
export class CartoonService {
  private readonly logger = new Logger(CartoonService.name);
  private session: ort.InferenceSession | null = null;
  private loading = false;

  // ── 模型管理 ──────────────────────────────────────────────────

  private async ensureModel(): Promise<void> {
    if (this.session) return;
    if (this.loading) {
      // 等待已在进行的加载
      while (this.loading) await new Promise((r) => setTimeout(r, 200));
      if (this.session) return;
    }
    this.loading = true;
    try {
      fs.mkdirSync(MODELS_DIR, { recursive: true });
      if (!fs.existsSync(MODEL_PATH)) {
        const url = process.env.CARTOON_MODEL_URL ?? DEFAULT_MODEL_URL;
        this.logger.log(`Downloading cartoon model from ${url} …`);
        const resp = await axios.get<ArrayBuffer>(url, {
          responseType: 'arraybuffer',
          timeout: 120_000,
        });
        fs.writeFileSync(MODEL_PATH, Buffer.from(resp.data));
        this.logger.log('Model downloaded successfully');
      }
      this.session = await ort.InferenceSession.create(MODEL_PATH, {
        executionProviders: ['cpu'],
      });
      this.logger.log('ONNX session ready');
    } finally {
      this.loading = false;
    }
  }

  // ── 推理 ──────────────────────────────────────────────────────

  async convert(imageBuffer: Buffer): Promise<Buffer> {
    try {
      await this.ensureModel();
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      throw new BadRequestException(`模型加载失败：${msg}。请检查 CARTOON_MODEL_URL 配置或网络连接。`);
    }

    // 1. 读取图片信息，按比例调整尺寸（短边最大 512px，对齐到 8）
    const meta = await sharp(imageBuffer, { failOn: 'none' }).metadata();
    const origW = meta.width ?? 512;
    const origH = meta.height ?? 512;
    const maxPx = Number(process.env.CARTOON_MAX_PX ?? 1024);
    const scale = Math.min(1, maxPx / Math.max(origW, origH));
    const w = alignTo8(Math.round(origW * scale));
    const h = alignTo8(Math.round(origH * scale));

    // 2. 用 Sharp 解码为原始 RGB Uint8
    const raw = await sharp(imageBuffer, { failOn: 'none' })
      .resize(w, h, { fit: 'fill' })
      .removeAlpha()
      .raw()
      .toBuffer();

    // 3. HWC uint8 → NHWC float32，归一化到 [-1, 1]
    const n = h * w * 3;
    const float32 = new Float32Array(n);
    for (let i = 0; i < n; i++) {
      float32[i] = raw[i] / 127.5 - 1.0;
    }

    // 4. ONNX 推理
    const inputName = this.session!.inputNames[0];
    const tensor = new ort.Tensor('float32', float32, [1, h, w, 3]);
    const results = await this.session!.run({ [inputName]: tensor });
    const output = results[this.session!.outputNames[0]].data as Float32Array;

    // 5. NHWC float32 → HWC uint8，反归一化
    const outRaw = Buffer.alloc(n);
    for (let i = 0; i < n; i++) {
      outRaw[i] = Math.max(0, Math.min(255, Math.round((output[i] + 1.0) * 127.5)));
    }

    // 6. 恢复原始尺寸并输出 PNG
    return sharp(outRaw, { raw: { width: w, height: h, channels: 3 } })
      .resize(origW, origH, { fit: 'fill', kernel: 'lanczos3' })
      .png()
      .toBuffer();
  }
}
