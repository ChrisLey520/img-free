import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import GIFEncoder from 'gif-encoder-2';

export interface SpritesheetConfig {
  cellW: number;
  cellH: number;
  columns: number;
  fit: 'inside' | 'cover' | 'fill';
  fps: number;
  frameNames: string[];
}

@Injectable()
export class SpritesheetService {
  private async resizeFrame(buf: Buffer, cellW: number, cellH: number, fit: SpritesheetConfig['fit']): Promise<Buffer> {
    const base = sharp(buf, { failOn: 'none' }).ensureAlpha();

    if (fit === 'inside') {
      const resized = await base
        .resize({ width: cellW, height: cellH, fit: 'inside', kernel: 'lanczos3' })
        .png()
        .toBuffer();
      const meta = await sharp(resized).metadata();
      const iw = meta.width ?? 0;
      const ih = meta.height ?? 0;
      const left = Math.max(0, Math.floor((cellW - iw) / 2));
      const top  = Math.max(0, Math.floor((cellH - ih) / 2));
      return sharp({
        create: { width: cellW, height: cellH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
      })
        .composite([{ input: resized, left, top }])
        .png()
        .toBuffer();
    }

    return base
      .resize({ width: cellW, height: cellH, fit, kernel: 'lanczos3', position: 'centre' })
      .png()
      .toBuffer();
  }

  async build(frameBuffers: Buffer[], config: SpritesheetConfig) {
    const { cellW, cellH, columns, fit, fps, frameNames } = config;
    const frameCount = frameBuffers.length;
    const rows = Math.ceil(frameCount / columns);
    const sheetW = columns * cellW;
    const sheetH = rows * cellH;

    // 1. 缩放每一帧
    const resized = await Promise.all(
      frameBuffers.map((buf) => this.resizeFrame(buf, cellW, cellH, fit)),
    );

    // 2. 拼合精灵表 PNG
    const composites = resized.map((buf, i) => ({
      input: buf,
      left: (i % columns) * cellW,
      top: Math.floor(i / columns) * cellH,
    }));
    const sheet = await sharp({
      create: { width: sheetW, height: sheetH, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } },
    })
      .composite(composites)
      .png({ compressionLevel: 6 })
      .toBuffer();

    // 3. Atlas JSON（Texture Packer 兼容格式）
    const atlasFrames: Record<string, { frame: { x: number; y: number; w: number; h: number } }> = {};
    for (let i = 0; i < frameCount; i++) {
      const name = frameNames[i] ?? `frame_${i}`;
      atlasFrames[name] = {
        frame: {
          x: (i % columns) * cellW,
          y: Math.floor(i / columns) * cellH,
          w: cellW,
          h: cellH,
        },
      };
    }
    const atlasJson = {
      frames: atlasFrames,
      meta: {
        size: { w: sheetW, h: sheetH },
        cellW, cellH, columns, rows,
      },
    };

    // 4. 动画 GIF
    // 不使用 createReadStream()：流式写法存在竞态（emitData 会清空内部 buffer）。
    // 直接用同步方式写帧，finish() 后从 encoder.out.getData() 取完整字节。
    const delay = Math.max(20, Math.round(1000 / fps));
    const encoder = new GIFEncoder(cellW, cellH, 'octree');
    encoder.start();
    encoder.setDelay(delay);
    encoder.setRepeat(0);
    encoder.setQuality(10);

    for (const frameBuf of resized) {
      const { data } = await sharp(frameBuf)
        .ensureAlpha()
        .raw()
        .toBuffer({ resolveWithObject: true });
      encoder.addFrame(data);
    }
    encoder.finish();

    const gifBuffer = encoder.out.getData();

    return {
      sheet,
      atlasJson,
      gifBuffer,
      sheetW,
      sheetH,
      frameCount,
    };
  }
}
