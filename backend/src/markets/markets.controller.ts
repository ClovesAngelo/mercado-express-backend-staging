import { Controller, Get, Post, Body, Param, Patch, Delete, UseGuards, Req, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { MarketsService } from './markets.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';
import { AuditService } from '../audit/audit.service';

@Controller('markets')
@UseGuards(JwtAuthGuard, RolesGuard)
export class MarketsController {
  private readonly logger = new Logger(MarketsController.name);
  constructor(private marketsService: MarketsService, private auditService: AuditService) {}

  @Post()
  @Roles(UserRole.ADMIN_GERAL)
  async create(@Body() createMarketDto: any, @Req() req: any) {
    try {
      const result = await this.marketsService.create(createMarketDto);
      const user = req.user;
      if (user) {
        this.auditService.log({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'MARKET_CREATED',
          entity: 'Market',
          entityId: result.id,
          newValues: { name: result.name, address: result.address },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
      return result;
    } catch (error) {
      this.logger.error(`ERROR creating market: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao criar mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get()
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO, UserRole.CLIENTE)
  async findAll() {
    try {
      return await this.marketsService.findAll();
    } catch (error) {
      this.logger.error(`ERROR fetching markets: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar mercados',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('with-manager')
  @Roles(UserRole.ADMIN_GERAL)
  async findAllWithManager() {
    try {
      return await this.marketsService.findAllWithManager();
    } catch (error) {
      this.logger.error(`ERROR fetching markets with manager: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar mercados com gestor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Post('with-manager')
  @Roles(UserRole.ADMIN_GERAL)
  async createWithManager(@Body() body: { market: any; manager: any }, @Req() req: any) {
    try {
      const result = await this.marketsService.createWithManager(body.market, body.manager);
      const user = req.user;
      if (user) {
        this.auditService.log({
          userId: user.id,
          userName: user.name,
          userEmail: user.email,
          action: 'MARKET_WITH_MANAGER_CREATED',
          entity: 'Market',
          entityId: result.market.id,
          newValues: { market: result.market.name, manager: result.manager.email },
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
      }
      return result;
    } catch (error) {
      this.logger.error(`ERROR creating market with manager: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao criar mercado com gestor',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO, UserRole.CLIENTE)
  async findOne(@Param('id') id: string, @Req() req: any) {
    try {
      const user = req.user;
      if (user?.role === UserRole.CLIENTE) {
        return await this.marketsService.findOnePublic(id);
      }
      return await this.marketsService.findOne(id);
    } catch (error) {
      this.logger.error(`ERROR fetching market: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN_GERAL)
  async activate(@Param('id') id: string) {
    try {
      return await this.marketsService.setActive(id, true);
    } catch (error) {
      this.logger.error(`ERROR activating market: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao ativar mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN_GERAL)
  async deactivate(@Param('id') id: string) {
    try {
      return await this.marketsService.setActive(id, false);
    } catch (error) {
      this.logger.error(`ERROR deactivating market: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao desativar mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN_GERAL)
  async remove(@Param('id') id: string) {
    try {
      return await this.marketsService.remove(id);
    } catch (error) {
      this.logger.error(`ERROR deleting market: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao excluir mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN_GERAL, UserRole.GESTOR_MERCADO, UserRole.CLIENTE)
  async update(@Param('id') id: string, @Body() updateData: any, @Req() req: any) {
    try {
      const user = req.user;
      return await this.marketsService.update(id, updateData, user);
    } catch (error) {
      this.logger.error(`ERROR updating market: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao atualizar mercado',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}

