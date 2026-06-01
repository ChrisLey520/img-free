import sharp from 'sharp';
import type { GamePayload, SpriteOptions } from './convert.types';

type SpriteEnabled = SpriteOptions & {
  enabled: true;
  width: number;
  height: number;
};

function toHexByte(n: number): string {
  return n.toString(16).padStart(2, '0');
}

function rgbaToHex(r: number, g: number, b: number, a: number): string {
  return `#${toHexByte(r)}${toHexByte(g)}${toHexByte(b)}${toHexByte(a)}`;
}

function colorKey(data: Buffer, o: number): string {
  return `${data[o]},${data[o + 1]},${data[o + 2]},${data[o + 3]}`;
}

function parseKey(key: string): [number, number, number, number] {
  const [r, g, b, a] = key.split(',').map((x) => Number.parseInt(x, 10));
  return [r, g, b, a];
}

function distSq(
  r: number,
  g: number,
  b: number,
  a: number,
  r2: number,
  g2: number,
  b2: number,
  a2: number,
): number {
  const dr = r - r2;
  const dg = g - g2;
  const db = b - b2;
  const da = a - a2;
  return dr * dr + dg * dg + db * db + da * da;
}

function nearestIndex(
  r: number,
  g: number,
  b: number,
  a: number,
  paletteKeys: string[],
): number {
  let best = 0;
  let bestD = Number.POSITIVE_INFINITY;
  for (let i = 0; i < paletteKeys.length; i++) {
    const [r2, g2, b2, a2] = parseKey(paletteKeys[i]);
    const d = distSq(r, g, b, a, r2, g2, b2, a2);
    if (d < bestD) {
      bestD = d;
      best = i;
    }
  }
  return best;
}

function canvasBackground(sprite: SpriteEnabled): {
  r: number;
  g: number;
  b: number;
  alpha: number;
} {
  if (sprite.background) {
    return {
      r: sprite.background.r,
      g: sprite.background.g,
      b: sprite.background.b,
      alpha: sprite.background.a / 255,
    };
  }
  return { r: 0, g: 0, b: 0, alpha: 0 };
}

/**
 * 缩放 + 固定 WxH 画布 + 可选调色板 PNG。
 * - inside：等比落入框内后居中铺到精确 WxH（letterbox）
 * - cover / fill：Sharp resize 直接得到精确 WxH
 * kernel 默认 nearest（原有行为）；传入 lanczos3 可获得更高品质。
 */
export async function buildSpritePngBuffer(
  input: Buffer,
  sprite: SpriteEnabled,
  pngCompressionLevel: number,
): Promise<Buffer> {
  const fit = sprite.fit ?? 'inside';
  const pc = sprite.paletteColors;
  const kernel = (sprite.kernel as sharp.KernelEnum[keyof sharp.KernelEnum] | undefined)
    ?? sharp.kernel.nearest;
  const pngOptions: sharp.PngOptions =
    pc != null
      ? { palette: true, colors: pc, dither: 1.0, compressionLevel: pngCompressionLevel }
      : { compressionLevel: pngCompressionLevel };

  if (fit === 'inside') {
    const resizedBuf = await sharp(input, { failOn: 'none' })
      .ensureAlpha()
      .resize({
        width: sprite.width,
        height: sprite.height,
        fit: 'inside',
        kernel,
      })
      .toBuffer();

    const meta = await sharp(resizedBuf).metadata();
    const iw = meta.width ?? 0;
    const ih = meta.height ?? 0;
    const left = Math.max(0, Math.floor((sprite.width - iw) / 2));
    const top = Math.max(0, Math.floor((sprite.height - ih) / 2));
    const bg = canvasBackground(sprite);

    return sharp({
      create: {
        width: sprite.width,
        height: sprite.height,
        channels: 4,
        background: bg,
      },
    })
      .composite([{ input: resizedBuf, left, top }])
      .png(pngOptions)
      .toBuffer();
  }

  const resizeOpts: sharp.ResizeOptions = {
    width: sprite.width,
    height: sprite.height,
    fit,
    kernel,
    position: 'centre',
  };
  if (fit === 'cover') {
    resizeOpts.background = canvasBackground(sprite);
  }

  return sharp(input, { failOn: 'none' })
    .ensureAlpha()
    .resize(resizeOpts)
    .png(pngOptions)
    .toBuffer();
}

/**
 * 从最终 PNG 解码 RGBA，生成调色板与 row-major 索引（与像素颜色对齐）。
 * 若唯一色 >256，保留出现频率最高的 256 色并对其余像素做最近邻映射。
 */
export async function buildGamePayloadFromPng(
  png: Buffer,
): Promise<GamePayload> {
  const { data, info } = await sharp(png, { failOn: 'none' })
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  const width = info.width;
  const height = info.height;
  const n = width * height;
  const channels = info.channels;
  if (channels !== 4) {
    throw new Error(`Expected 4 channels RGBA, got ${channels}`);
  }

  const counts = new Map<string, number>();
  const order: string[] = [];
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const key = colorKey(data, o);
    if (!counts.has(key)) {
      counts.set(key, 0);
      order.push(key);
    }
    counts.set(key, counts.get(key)! + 1);
  }

  let paletteKeys: string[];
  if (order.length <= 256) {
    paletteKeys = order;
  } else {
    paletteKeys = [...counts.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 256)
      .map(([k]) => k);
  }

  const palette = paletteKeys.map((k) => {
    const [r, g, b, a] = parseKey(k);
    return rgbaToHex(r, g, b, a);
  });

  const keyToIdx = new Map<string, number>();
  paletteKeys.forEach((k, i) => keyToIdx.set(k, i));

  const indices = new Array<number>(n);
  for (let i = 0; i < n; i++) {
    const o = i * 4;
    const key = colorKey(data, o);
    const idx = keyToIdx.get(key);
    if (idx !== undefined) {
      indices[i] = idx;
    } else {
      indices[i] = nearestIndex(
        data[o],
        data[o + 1],
        data[o + 2],
        data[o + 3],
        paletteKeys,
      );
    }
  }

  return {
    layout: 'rowMajor',
    width,
    height,
    palette,
    indices,
  };
}
