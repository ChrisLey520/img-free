import { z } from 'zod';

export const TargetFormatSchema = z.enum(['png', 'jpeg', 'ico', 'svg']);

/** 与 convert.service 输出精灵限额一致（Zod 与实现共用） */
export const SPRITE_LIMITS = {
  MAX_SIDE: 512,
  MAX_CELLS: 512 * 512,
  /** gamePayload 仅允许小图，避免响应体过大 */
  MAX_GAME_PAYLOAD_CELLS: 4096,
} as const;

const MAX_SPRITE_SIDE = SPRITE_LIMITS.MAX_SIDE;
const MAX_SPRITE_CELLS = SPRITE_LIMITS.MAX_CELLS;
const MAX_GAME_PAYLOAD_CELLS = SPRITE_LIMITS.MAX_GAME_PAYLOAD_CELLS;

const SpriteBackgroundSchema = z.object({
  r: z.number().int().min(0).max(255),
  g: z.number().int().min(0).max(255),
  b: z.number().int().min(0).max(255),
  a: z.number().int().min(0).max(255),
});

export const SpriteOptionsSchema = z
  .object({
    enabled: z.boolean(),
    width: z.number().int().min(1).max(MAX_SPRITE_SIDE).optional(),
    height: z.number().int().min(1).max(MAX_SPRITE_SIDE).optional(),
    fit: z.enum(['inside', 'cover', 'fill']).optional(),
    background: SpriteBackgroundSchema.optional(),
    paletteColors: z
      .union([z.number().int().min(2).max(256), z.null()])
      .optional(),
    includeGamePayload: z.boolean().optional(),
    /** 缩放核，默认 nearest（原有行为）；lanczos3 品质更高，适合头像制作 */
    kernel: z.enum(['nearest', 'lanczos2', 'lanczos3', 'mitchell', 'cubic']).optional(),
  })
  .superRefine((val, ctx) => {
    if (!val.enabled) return;
    if (val.width == null || val.height == null) {
      ctx.addIssue({
        code: 'custom',
        message:
          'sprite.width and sprite.height are required when sprite.enabled is true',
        path: ['width'],
      });
      return;
    }
    const cells = val.width * val.height;
    if (cells > MAX_SPRITE_CELLS) {
      ctx.addIssue({
        code: 'custom',
        message: `Sprite dimensions too large (max side ${MAX_SPRITE_SIDE}, max cells ${MAX_SPRITE_CELLS})`,
        path: ['width'],
      });
    }
    if (val.includeGamePayload && cells > MAX_GAME_PAYLOAD_CELLS) {
      ctx.addIssue({
        code: 'custom',
        message: `gamePayload is only available when width × height <= ${MAX_GAME_PAYLOAD_CELLS}`,
        path: ['includeGamePayload'],
      });
    }
  });

export const ConvertOptionsSchema = z.object({
  jpegQuality: z.number().int().min(1).max(100).optional(),
  pngCompressionLevel: z.number().int().min(0).max(9).optional(),
  icoSizes: z.array(z.number().int().min(8).max(1024)).optional(),
  trace: z
    .object({
      mode: z.enum(['mono', 'color']).optional(),
      threshold: z.number().int().min(0).max(255).optional(),
      turdSize: z.number().int().min(0).max(1000).optional(),
      optTolerance: z.number().min(0).max(10).optional(),
      blackOnWhite: z.boolean().optional(),
      // 彩色矢量化：颜色数量越高越接近原图，但 SVG 会更大更复杂
      colors: z.number().int().min(2).max(256).optional(),
    })
    .optional(),
  sprite: SpriteOptionsSchema.optional(),
});

export const ConvertRequestSchema = z.object({
  targetFormat: TargetFormatSchema,
  options: ConvertOptionsSchema.optional(),
});

export type TargetFormat = z.infer<typeof TargetFormatSchema>;
export type ConvertOptions = z.infer<typeof ConvertOptionsSchema>;
export type ConvertRequest = z.infer<typeof ConvertRequestSchema>;
export type SpriteOptions = z.infer<typeof SpriteOptionsSchema>;

/** 与 PNG 解码像素在颜色上对齐的引擎用载荷（row-major） */
export type GamePayload = {
  layout: 'rowMajor';
  width: number;
  height: number;
  palette: string[];
  indices: number[];
};
