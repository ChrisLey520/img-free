import { Module } from '@nestjs/common';
import { CartoonController } from './cartoon.controller.js';
import { CartoonService } from './cartoon.service.js';

@Module({
  controllers: [CartoonController],
  providers: [CartoonService],
})
export class CartoonModule {}
