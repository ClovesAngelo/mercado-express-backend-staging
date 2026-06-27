import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, HttpException, HttpStatus, Logger, Req } from '@nestjs/common';
import { ManagersService } from './managers.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Controller('managers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ManagersController {
  private readonly logger = new Logger(ManagersController.name);
  constructor(private managersService: ManagersService, private auditService: AuditService) {}

  @Get()
  @Roles(UserRole.ADMIN_GERAL)
  async findAll() {
    try {
      return await this.managersService.findAll();
    } catch (error) {
      this.logger.error(`ERROR fetching managers: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar gestores',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_GERAL)
  async findOne(@Param('id') id: string) {
    try {
      return await this.managersService.findOne(id);
    } catch (error) {
      this.logger.error(`ERROR fetching manager: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar gestor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post()
  @Roles(UserRole.ADMIN_GERAL)
  async create(@Body() body: { name: string; email: string; password: string; marketId?: string | null }, @Req() req: any) {
    try {
      const result = await this.managersService.create(body);
      const user = req.user;
      if (user) {
        this.auditService.log({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'MANAGER_CREATED',
          entity: 'User',
          entityId: result.id,
          newValues: { name: result.name, email: result.email, marketId: result.marketId },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
      return result;
    } catch (error) {
      this.logger.error(`ERROR creating manager: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao criar gestor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN_GERAL)
  async update(@Param('id') id: string, @Body() body: { name?: string; email?: string; marketId?: string | null }, @Req() req: any) {
    try {
      const result = await this.managersService.update(id, body);
      const user = req.user;
      if (user) {
        this.auditService.log({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'MANAGER_UPDATED',
          entity: 'User',
          entityId: result.id,
          newValues: body,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
      return result;
    } catch (error) {
      this.logger.error(`ERROR updating manager: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao atualizar gestor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_GERAL)
  async remove(@Param('id') id: string, @Req() req: any) {
    try {
      const result = await this.managersService.remove(id);
      const user = req.user;
      if (user) {
        this.auditService.log({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'MANAGER_DELETED',
          entity: 'User',
          entityId: id,
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
      return result;
    } catch (error) {
      this.logger.error(`ERROR deleting manager: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao remover gestor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
