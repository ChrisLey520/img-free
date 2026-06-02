import {
  BadRequestException,
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { z } from 'zod';
import { AiSpriteService, type PipelineMode, type Provider } from './ai-sprite.service.js';

const RequestSchema = z.object({
  characterDesc: z.string().default(''),
  action:        z.string().min(1).max(100),
  frameCount:    z.coerce.number().int().min(1).max(8).default(4),
  cellW:         z.coerce.number().int().min(16).max(256).default(64),
  cellH:         z.coerce.number().int().min(16).max(256).default(64),
  style:         z.enum(['pixel', 'smooth']).default('pixel'),
  mode:          z.enum(['img2img', 'controlnet']).default('img2img'),
  provider:      z.enum(['replicate', 'huggingface']).default('replicate'),
});

@Controller('ai-sprite')
export class AiSpriteController {
  constructor(private readonly service: AiSpriteService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async generate(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: unknown,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('Missing character image');
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());

    return this.service.generate({
      imageBuffer:   file.buffer,
      characterDesc: parsed.data.characterDesc,
      action:        parsed.data.action,
      frameCount:    parsed.data.frameCount,
      cellW:         parsed.data.cellW,
      cellH:         parsed.data.cellH,
      style:         parsed.data.style,
      mode:          parsed.data.mode as PipelineMode,
      provider:      parsed.data.provider as Provider,
    });
  }
}
