import { Controller, Get, UseGuards, Param, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DashboardController {
  private readonly logger = new Logger(DashboardController.name);
  constructor(private dashboardService: DashboardService) {}

  @Get('dashboard')
  @Roles(UserRole.ADMIN_GERAL)
  async getGeneralStats() {
    try {
      return await this.dashboardService.getGeneralStats();
    } catch (error) {
      this.logger.error(`ERROR fetching general stats: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao carregar estatísticas',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('dashboard/market/:marketId')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async getMarketStats(@Param('marketId') marketId: string) {
    try {
      return await this.dashboardService.getMarketStats(marketId);
    } catch (error) {
      this.logger.error(`ERROR fetching market stats: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao carregar estatísticas do mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}