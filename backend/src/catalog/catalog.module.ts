import { Module } from '@nestjs/common';
import { CatalogService } from './catalog.service';
import { CatalogController } from './catalog.controller';
import { PrismaModule } from '../prisma/prisma.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { UploadModule } from '../upload/upload.module';
import { OpenFoodFactsService } from './open-food-facts.service';

@Module({
  imports: [PrismaModule, NotificationsModule, UploadModule],
  controllers: [CatalogController],
  providers: [CatalogService, OpenFoodFactsService],
  exports: [CatalogService],
})
export class CatalogModule {}
