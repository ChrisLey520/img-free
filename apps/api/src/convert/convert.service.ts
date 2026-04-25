import { BadRequestException, Injectable } from '@nestjs/common';
import sharp from 'sharp';
import { optimize as optimizeSvg } from 'svgo';
import potrace from 'potrace';
import ImageTracer from 'imagetracerjs';
import type {
  ConvertOptions,
  GamePayload,
  TargetFormat,
} from './convert.types';
import {
  buildGamePayloadFromPng,
  buildSpritePngBuffer,
} from './sprite-pipeline';
import { decodeKleiTexToPng } from './tex/stexatlaser';

const MAX_BYTES = 25 * 1024 * 1024;
const MAX_PIXELS = 40_000_000;

function toDataUrl(mime: string, buf: Buffer) {
  return `data:${mime};base64,${buf.toString('base64')}`;
}

function mimeFromFilename(filename: string | undefined): string {
  const name = (filename ?? '').toLowerCase();
  if (name.endsWith('.svg')) return 'image/svg+xml';
  if (name.endsWith('.png')) return 'image/png';
  if (name.endsWith('.jpg') || name.endsWith('.jpeg')) return 'image/jpeg';
  if (name.endsWith('.ico')) return 'image/x-icon';
  if (name.endsWith('.tex')) return 'application/x-klei-tex';
  return 'application/octet-stream';
}

async function ensurePixelLimit(input: Buffer) {
  const meta = await sharp(input, { failOn: 'none' }).metadata();
  if (!meta.width || !meta.height) return;
  if (meta.width * meta.height > MAX_PIXELS) {
    throw new BadRequestException(
      `Image too large: ${meta.width}x${meta.height}`,
    );
  }
}

/** 像素精灵仅支持 PNG 输出，避免与 JPEG/ICO/SVG 语义冲突 */
function assertSpriteCompatibleWithTarget(
  sprite: ConvertOptions['sprite'] | undefined,
  targetFormat: TargetFormat,
): void {
  if (!sprite?.enabled) return;
  if (targetFormat !== 'png') {
    if (targetFormat === 'jpeg') {
      throw new BadRequestException(
        'Pixel sprite output requires PNG (JPEG is lossy and blurs hard edges).',
      );
    }
    throw new BadRequestException(
      'Pixel sprite is only supported for PNG output in this version.',
    );
  }
}

async function rasterToSvg(
  rasterPng: Buffer,
  options: ConvertOptions | undefined,
): Promise<string> {
  const trace = options?.trace;
  const mode = trace?.mode ?? 'mono';
  const threshold = trace?.threshold ?? 180;
  const turdSize = trace?.turdSize ?? 2;
  const optTolerance = trace?.optTolerance ?? 0.2;
  const blackOnWhite = trace?.blackOnWhite ?? true;

  let svgRaw: string;

  if (mode === 'color') {
    const colors = trace?.colors ?? 32;
    const { data, info } = await sharp(rasterPng, { failOn: 'none' })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    // imagetracerjs expects an ImageData-like object { width, height, data: Uint8ClampedArray }
    const imageData = {
      width: info.width,
      height: info.height,
      data: new Uint8ClampedArray(
        data.buffer,
        data.byteOffset,
        data.byteLength,
      ),
    };

    svgRaw = ImageTracer.imagedataToSVG(imageData, {
      numberofcolors: colors,
      // Preserve more detail by default; callers can optimize further via svgo.
      pathomit: 0,
      // Lower thresholds => more detail (but larger svg)
      ltres: 1,
      qtres: 1,
    });
  } else {
    // potrace is monochrome and works best with a thresholded grayscale image.
    const prepared = await sharp(rasterPng)
      .grayscale()
      .threshold(threshold)
      .png()
      .toBuffer();

    svgRaw = await new Promise<string>((resolve, reject) => {
      potrace.trace(
        prepared,
        {
          turdSize,
          optTolerance,
          blackOnWhite,
        },
        (err: Error | null, svg: string) => {
          if (err || !svg)
            return reject(err ?? new Error('potrace returned empty svg'));
          resolve(svg);
        },
      );
    });
  }

  const optimized = optimizeSvg(svgRaw, {
    multipass: true,
  });
  return optimized.data;
}

@Injectable()
export class ConvertService {
  async convert(
    input: Buffer,
    filename: string | undefined,
    targetFormat: TargetFormat,
    options?: ConvertOptions,
  ) {
    if (input.length > MAX_BYTES)
      throw new BadRequestException(`File too large (> ${MAX_BYTES} bytes)`);

    let working = input;
    const ext = (filename ?? '').toLowerCase();

    // Handle Klei/DST .tex by decoding to PNG first.
    if (ext.endsWith('.tex')) {
      try {
        working = await decodeKleiTexToPng(input);
      } catch (e) {
        const msg = (e as Error).message ?? String(e);
        const extraHint = msg.includes('rosetta error')
          ? ' (Docker Desktop: enable x86/amd64 emulation/Rosetta, then retry)'
          : '';
        throw new BadRequestException(
          `Failed to decode .tex. Ensure stexatlaser is available (set STEXATLASER_BIN or place binary at apps/api/bin/stexatlaser). ${msg}${extraHint}`,
        );
      }
    }

    const inputMime = mimeFromFilename(filename);

    await ensurePixelLimit(working);

    assertSpriteCompatibleWithTarget(options?.sprite, targetFormat);

    // SVG input: sharp can rasterize it to PNG for preview / other formats.
    const isSvg = inputMime === 'image/svg+xml' || ext.endsWith('.svg');
    const inputForSharp = working;

    // 左侧预览：整图（不经 sprite 几何变换）；sprite 只作用于右侧输出管线
    const inputPreviewPng = await sharp(inputForSharp, { failOn: 'none' })
      .png()
      .toBuffer();

    let outputBuf: Buffer;
    let outputMime: string;
    let outputPreviewPng: Buffer;
    let gamePayload: GamePayload | undefined;

    if (targetFormat === 'svg') {
      if (isSvg) {
        // Keep SVG as-is (but optimize) when input is SVG.
        const optimized = optimizeSvg(working.toString('utf8'), {
          multipass: true,
        });
        const svgText = optimized.data;
        outputBuf = Buffer.from(svgText, 'utf8');
        outputMime = 'image/svg+xml';
        // Preview for SVG: rasterize
        outputPreviewPng = await sharp(outputBuf, { failOn: 'none' })
          .png()
          .toBuffer();
      } else {
        // Raster -> SVG (vectorize/trace)
        const svgText = await rasterToSvg(
          await sharp(inputForSharp).png().toBuffer(),
          options,
        );
        outputBuf = Buffer.from(svgText, 'utf8');
        outputMime = 'image/svg+xml';
        outputPreviewPng = await sharp(outputBuf, { failOn: 'none' })
          .png()
          .toBuffer();
      }
    } else if (targetFormat === 'ico') {
      // png-to-ico is ESM; load it dynamically to keep common test paths simple.
      const { default: pngToIco } = await import('png-to-ico');
      const sizes = options?.icoSizes?.length
        ? options.icoSizes
        : [16, 32, 48, 256];
      const pngs = await Promise.all(
        sizes.map((s) =>
          sharp(inputForSharp, { failOn: 'none' })
            .resize(s, s, { fit: 'contain' })
            .png()
            .toBuffer(),
        ),
      );
      outputBuf = await pngToIco(pngs);
      outputMime = 'image/x-icon';
      outputPreviewPng = pngs[pngs.length - 1]!;
    } else if (targetFormat === 'jpeg') {
      outputBuf = await sharp(inputForSharp, { failOn: 'none' })
        .jpeg({ quality: options?.jpegQuality ?? 85 })
        .toBuffer();
      outputMime = 'image/jpeg';
      outputPreviewPng = await sharp(outputBuf, { failOn: 'none' })
        .png()
        .toBuffer();
    } else {
      const pngLevel = options?.pngCompressionLevel ?? 9;
      const sp = options?.sprite;
      if (sp?.enabled && sp.width != null && sp.height != null) {
        outputBuf = await buildSpritePngBuffer(
          inputForSharp,
          {
            ...sp,
            enabled: true,
            width: sp.width,
            height: sp.height,
          },
          pngLevel,
        );
        outputMime = 'image/png';
        outputPreviewPng = outputBuf;
        if (sp.includeGamePayload) {
          gamePayload = await buildGamePayloadFromPng(outputBuf);
        }
      } else {
        outputBuf = await sharp(inputForSharp, { failOn: 'none' })
          .png({ compressionLevel: pngLevel })
          .toBuffer();
        outputMime = 'image/png';
        outputPreviewPng = outputBuf;
      }
    }

    const inMeta = await sharp(inputPreviewPng).metadata();
    const outMeta = await sharp(outputPreviewPng).metadata();

    return {
      input: {
        mime: inputMime,
        bytes: working.length,
        width: inMeta.width ?? null,
        height: inMeta.height ?? null,
        previewDataUrl: toDataUrl('image/png', inputPreviewPng),
      },
      output: {
        mime: outputMime,
        bytes: outputBuf.length,
        width: outMeta.width ?? null,
        height: outMeta.height ?? null,
        dataUrl: toDataUrl(outputMime, outputBuf),
        previewDataUrl: toDataUrl('image/png', outputPreviewPng),
        ...(gamePayload ? { gamePayload } : {}),
      },
    };
  }
}
