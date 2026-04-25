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
import { ConvertRequestSchema } from './convert.types';
import { ConvertService } from './convert.service';

const MAX_BYTES = 25 * 1024 * 1024;

const BodySchema = z.object({
  targetFormat: z.string(),
  options: z.string().optional(),
});

@Controller()
export class ConvertController {
  constructor(private readonly convertService: ConvertService) {}

  @Post('/convert')
  @UseInterceptors(
    FileInterceptor('input', {
      limits: {
        fileSize: MAX_BYTES,
      },
    }),
  )
  async convert(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: unknown,
  ) {
    if (!file?.buffer?.length)
      throw new BadRequestException('Missing file field "input"');

    const parsedBody = BodySchema.safeParse(body);
    if (!parsedBody.success)
      throw new BadRequestException('Invalid form fields');

    const optionsJson = parsedBody.data.options;
    let optionsParsed: unknown;
    if (optionsJson) {
      try {
        optionsParsed = JSON.parse(optionsJson);
      } catch {
        throw new BadRequestException('Invalid JSON in "options"');
      }
    }
    const req = ConvertRequestSchema.safeParse({
      targetFormat: parsedBody.data.targetFormat,
      options: optionsJson ? optionsParsed : undefined,
    });
    if (!req.success) {
      throw new BadRequestException(req.error.flatten());
    }

    return await this.convertService.convert(
      file.buffer,
      file.originalname,
      req.data.targetFormat,
      req.data.options,
    );
  }
}
