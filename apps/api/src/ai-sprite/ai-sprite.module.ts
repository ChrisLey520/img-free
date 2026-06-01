import { Module } from '@nestjs/common';
import { AiSpriteController } from './ai-sprite.controller.js';
import { AiSpriteService } from './ai-sprite.service.js';

@Module({
  controllers: [AiSpriteController],
  providers: [AiSpriteService],
})
export class AiSpriteModule {}
