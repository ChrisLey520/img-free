import { Module } from '@nestjs/common';
import { SpritesheetController } from './spritesheet.controller.js';
import { SpritesheetService } from './spritesheet.service.js';

@Module({
  controllers: [SpritesheetController],
  providers: [SpritesheetService],
})
export class SpritesheetModule {}
