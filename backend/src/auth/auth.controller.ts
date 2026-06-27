import { Controller, Post, Body, HttpException, HttpStatus, Logger, Req } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { AuditService } from '../audit/audit.service';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(private authService: AuthService, private auditService: AuditService) {}

  @Throttle({ default: { ttl: 60000, limit: 5 } })
  @Post('login')
  async login(@Body() body: { email: string; password: string }, @Req() req: any) {
    try {
      this.logger.log(`Login request for: ${body?.email}`);
      
      if (!body?.email || !body?.password) {
        this.logger.warn('Login failed: Missing fields');
        throw new HttpException(
          'Email e senha são obrigatórios',
          HttpStatus.BAD_REQUEST
        );
      }
      
      const user = await this.authService.validateUser(body.email, body.password);
      if (!user) {
        this.logger.warn(`Login failed: Invalid credentials for ${body.email}`);
        this.auditService.log({
          userId: 'unknown',
          userName: 'unknown',
          userEmail: body.email,
          action: 'AUTH_LOGIN_FAILED',
          entity: 'User',
          ipAddress: req.ip,
          userAgent: req.headers['user-agent'],
        });
        throw new HttpException(
          'Email ou senha inválidos',
          HttpStatus.UNAUTHORIZED
        );
      }
      
      this.logger.log(`Login success: ${body.email}`);
      const result = await this.authService.login(user);
      
      this.auditService.log({
        userId: user.id,
        userName: user.name,
        userEmail: user.email,
        action: 'AUTH_LOGIN_SUCCESS',
        entity: 'User',
        entityId: user.id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
      });
      
      return result;
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      const message = error instanceof Error ? error.message : 'Erro interno no login';
      this.logger.error(`Login unexpected error: ${message}`, (error as Error).stack);
      throw new HttpException(
        message,
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Throttle({ default: { ttl: 60000, limit: 10 } })
  @Post('register')
  async register(@Body() body: any) {
    try {
      if (!body?.email || !body?.password || !body?.name) {
        throw new HttpException(
          'Email, senha e nome são obrigatórios',
          HttpStatus.BAD_REQUEST
        );
      }
      
      this.logger.log(`Register request for: ${body.email}`);
      return await this.authService.register(body);
    } catch (error) {
      if (error instanceof HttpException) {
        throw error;
      }
      
      this.logger.error(`Register error: ${(error as Error)?.message}`, (error as Error).stack);
      throw new HttpException(
        (error as Error)?.message || 'Erro interno no registro',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
