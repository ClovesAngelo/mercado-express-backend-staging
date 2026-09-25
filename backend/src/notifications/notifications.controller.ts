import {
  Controller,
  Get,
  Patch,
  Param,
  UseGuards,
  Req,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import type { Request } from 'express';

@Controller('notifications')
@UseGuards(JwtAuthGuard, RolesGuard)
export class NotificationsController {
  private readonly logger = new Logger(NotificationsController.name);

  constructor(private notificationsService: NotificationsService) {}

  @Get()
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async findMine(@Req() req: Request) {
    try {
      return await this.notificationsService.findForUser(req.user!.id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR fetching notifications: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        'Erro ao carregar notificações',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Get('unread-count')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async countUnread(@Req() req: Request) {
    try {
      const count = await this.notificationsService.countUnread(req.user!.id);
      return { count };
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR counting unread notifications: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        'Erro ao contar notificações',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch('read-all')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async markAllAsRead(@Req() req: Request) {
    try {
      return await this.notificationsService.markAllAsRead(req.user!.id);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR marking all notifications as read: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        'Erro ao marcar notificações como lidas',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  @Patch(':id/read')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO)
  async markAsRead(@Param('id') id: string, @Req() req: Request) {
    try {
      return await this.notificationsService.markAsRead(id, req.user!);
    } catch (error) {
      if (error instanceof HttpException) throw error;
      this.logger.error(
        `ERROR marking notification as read: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new HttpException(
        'Erro ao marcar notificação como lida',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
