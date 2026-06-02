import { Module } from '@nestjs/common';
import { ImageGenController } from './image-gen.controller.js';
import { ImageGenService } from './image-gen.service.js';

@Module({
  controllers: [ImageGenController],
  providers: [ImageGenService],
})
export class ImageGenModule {}
