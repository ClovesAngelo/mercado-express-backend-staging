import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { PrismaModule } from './prisma/prisma.module';
import { MarketsModule } from './markets/markets.module';
import { CatalogModule } from './catalog/catalog.module';
import { CartModule } from './cart/cart.module';
import { OrdersModule } from './orders/orders.module';
import { UsersModule } from './users/users.module';
import { DashboardModule } from './admin/dashboard.module';
import { UploadModule } from './upload/upload.module';
import { ManagersModule } from './managers/managers.module';
import { HealthModule } from './health/health.module';
import { AuditModule } from './audit/audit.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    AuthModule,
    PrismaModule,
    MarketsModule,
    CatalogModule,
    CartModule,
    OrdersModule,
    UsersModule,
    DashboardModule,
    UploadModule,
    ManagersModule,
    HealthModule,
    AuditModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
