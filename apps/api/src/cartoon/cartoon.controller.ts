import {
  BadRequestException,
  Controller,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CartoonService } from './cartoon.service.js';

@Controller('cartoon')
export class CartoonController {
  constructor(private readonly service: CartoonService) {}

  @Post('convert')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async convert(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Res() res: Response,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('请上传图片');
    const png = await this.service.convert(file.buffer);
    res.setHeader('Content-Type', 'image/png');
    res.setHeader('Content-Length', png.length);
    res.end(png);
  }
}
