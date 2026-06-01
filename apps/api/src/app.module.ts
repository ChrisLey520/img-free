import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module.js';
import { ConvertModule } from './convert/convert.module.js';
import { StorageModule } from './storage/storage.module.js';
import { RedemptionModule } from './redemption/redemption.module.js';
import { CleanupModule } from './cleanup/cleanup.module.js';
import { PddModule } from './pdd/pdd.module.js';
import { SpritesheetModule } from './spritesheet/spritesheet.module.js';
import { AiSpriteModule } from './ai-sprite/ai-sprite.module.js';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    DatabaseModule,
    ConvertModule,
    StorageModule,
    RedemptionModule,
    CleanupModule,
    PddModule,
    SpritesheetModule,
    AiSpriteModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
