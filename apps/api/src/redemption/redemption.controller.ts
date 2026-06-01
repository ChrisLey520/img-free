import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  NotFoundException,
  Param,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { z } from 'zod';
import { RedemptionService, PIXEL_PRESETS, type PresetKey, type StyleKey } from './redemption.service.js';

const ADMIN_KEY = process.env.ADMIN_KEY ?? '';

function assertAdmin(key: string | undefined) {
  if (!ADMIN_KEY) throw new ForbiddenException('ADMIN_KEY not configured');
  if (key !== ADMIN_KEY) throw new ForbiddenException('Unauthorized');
}

const GenerateSchema = z.object({ count: z.coerce.number().int().min(1).max(200) });
const ValidateSchema = z.object({ code: z.string().min(1) });
const RedeemBodySchema = z.object({
  code: z.string().min(1),
  preset: z.enum(['mini', 'standard', 'hd']).default('standard'),
  style: z.enum(['natural', 'retro']).default('natural'),
});

@Controller()
export class RedemptionController {
  constructor(private readonly redemptionService: RedemptionService) {}

  @Post('/admin/codes')
  async generate(
    @Headers('x-admin-key') key: string | undefined,
    @Body() body: unknown,
  ) {
    assertAdmin(key);
    const parsed = GenerateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('count required (1-200)');
    return this.redemptionService.generateCodes(parsed.data.count);
  }

  @Get('/admin/codes')
  async list(@Headers('x-admin-key') key: string | undefined) {
    assertAdmin(key);
    return this.redemptionService.listCodes();
  }

  @Post('/codes/validate')
  async validate(@Body() body: unknown) {
    const parsed = ValidateSchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('code required');
    return this.redemptionService.validate(parsed.data.code);
  }

  @Post('/codes/redeem')
  @UseInterceptors(FileInterceptor('image', { limits: { fileSize: 10 * 1024 * 1024 } }))
  async redeem(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body() body: unknown,
  ) {
    if (!file?.buffer?.length) throw new BadRequestException('Missing image file');
    const parsed = RedeemBodySchema.safeParse(body);
    if (!parsed.success) throw new BadRequestException('Invalid request body');
    return this.redemptionService.redeem(
      parsed.data.code,
      file.buffer,
      file.originalname,
      parsed.data.preset as PresetKey,
      parsed.data.style as StyleKey,
    );
  }

  @Get('/results/:code')
  async getResult(@Param('code') code: string, @Res() res: Response) {
    const buf = await this.redemptionService.getResult(code);
    if (!buf) throw new NotFoundException('Result not found or expired');
    res.set('Content-Type', 'image/png');
    res.set('Content-Disposition', `attachment; filename="${code}.png"`);
    res.set('Cache-Control', 'private, max-age=86400');
    res.send(buf);
  }

  @Get('/presets')
  getPresets() {
    return PIXEL_PRESETS;
  }
}
