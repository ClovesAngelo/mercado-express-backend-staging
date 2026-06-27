import { Controller, Get } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Controller('health')
export class HealthController {
  constructor(private prisma: PrismaService) {}

  @Get('live')
  async checkLiveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('ready')
  async checkReadiness() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { status: 'ready', database: 'connected', timestamp: new Date().toISOString() };
    } catch (error) {
      return { status: 'error', database: 'disconnected', timestamp: new Date().toISOString() };
    }
  }
}
