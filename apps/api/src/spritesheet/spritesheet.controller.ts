import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { SpritesheetService } from './spritesheet.service.js';

const MAX_FRAME_BYTES = 10 * 1024 * 1024;

const ConfigSchema = z.object({
  cellW:      z.coerce.number().int().min(1).max(512),
  cellH:      z.coerce.number().int().min(1).max(512),
  columns:    z.coerce.number().int().min(1).max(64),
  fit:        z.enum(['inside', 'cover', 'fill']).default('inside'),
  fps:        z.coerce.number().min(1).max(60).default(8),
  frameNames: z.preprocess(
    (v) => { try { return JSON.parse(v as string); } catch { return []; } },
    z.array(z.string()),
  ).default([]),
});

@Controller('spritesheet')
export class SpritesheetController {
  constructor(private readonly service: SpritesheetService) {}

  @Post('build')
  @UseInterceptors(FilesInterceptor('frames', 256, { limits: { fileSize: MAX_FRAME_BYTES } }))
  async build(
    @UploadedFiles() files: Express.Multer.File[] | undefined,
    @Body() body: unknown,
  ) {
    if (!files?.length) throw new BadRequestException('No frames uploaded');

    const parsed = ConfigSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    const { cellW, cellH, columns, fit, fps, frameNames } = parsed.data;

    const result = await this.service.build(
      files.map((f) => f.buffer),
      { cellW, cellH, columns, fit, fps, frameNames },
    );

    return {
      sheetDataUrl: `data:image/png;base64,${result.sheet.toString('base64')}`,
      atlasJson: result.atlasJson,
      gifDataUrl: `data:image/gif;base64,${result.gifBuffer.toString('base64')}`,
      sheetWidth: result.sheetW,
      sheetHeight: result.sheetH,
      frameCount: result.frameCount,
    };
  }
}
