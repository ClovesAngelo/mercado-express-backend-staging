import { Controller, Get, Post, Body, Param, UseGuards, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { UserRole } from '@prisma/client';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  private readonly logger = new Logger(UsersController.name);
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN_GERAL)
  async findAll() {
    try {
      return await this.usersService.findAll();
    } catch (error) {
      this.logger.error(`ERROR fetching users: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar usuários',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    try {
      return await this.usersService.findOne(id);
    } catch (error) {
      this.logger.error(`ERROR fetching user: ${(error as Error).message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro ao buscar usuário',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
