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
import { ImageGenService, type ImageModel, type GenerateMode } from './image-gen.service.js';

const Schema = z.object({
  mode:    z.enum(['text', 'image']).default('text'),
  model:   z.enum(['dall-e-2', 'dall-e-3', 'gpt-image-1', 'gpt-image-2']).default('dall-e-3'),
  prompt:  z.string().min(1).max(4000),
  n:       z.coerce.number().int().min(1).max(4).default(1),
  size:    z.string().default('1024x1024'),
  quality: z.string().optional(),
});

@Controller('image-gen')
export class ImageGenController {
  constructor(private readonly service: ImageGenService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 20 * 1024 * 1024 } }))
  async generate(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: unknown,
  ) {
    const parsed = Schema.safeParse(body);
    if (!parsed.success) throw new BadRequestException(parsed.error.flatten());
    const { mode, model, prompt, n, size, quality } = parsed.data;
    if (mode === 'image' && !file?.buffer?.length) {
      throw new BadRequestException('图生图模式需要上传参考图片');
    }
    return this.service.generate({
      mode: mode as GenerateMode,
      model: model as ImageModel,
      prompt,
      n,
      size,
      quality,
      imageBuffer: file?.buffer,
      imageMime:   file?.mimetype,
    });
  }
}
