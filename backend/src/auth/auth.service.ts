import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    try {
      this.logger.log(`Validating user: ${email}`);
      const user = await this.prisma.user.findUnique({ where: { email } });
      if (!user) {
        this.logger.warn(`User not found: ${email}`);
        return null;
      }
      const passwordMatch = await bcrypt.compare(password, user.password);
      this.logger.log(`Password match: ${passwordMatch}`);
      if (!passwordMatch) {
        return null;
      }
      const { password: _, ...result } = user;
      return result;
    } catch (error) {
      this.logger.error(`ERROR validating user: ${(error as Error).message}`, (error as Error).stack);
      throw error;
    }
  }

  async login(user: any) {
    try {
      this.logger.log(`Generating token for: ${user.email}`);
      const payload = { email: user.email, sub: user.id, role: user.role, marketId: user.marketId };
      const token = this.jwtService.sign(payload);
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          marketId: user.marketId,
        },
      };
    } catch (error) {
      this.logger.error(`ERROR generating token: ${(error as Error).message}`, (error as Error).stack);
      throw new UnauthorizedException('Erro ao gerar token de acesso');
    }
  }

  async register(createUserDto: any) {
    try {
      this.logger.log(`Registering user: ${createUserDto.email}`);
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword,
          role: createUserDto.role || 'CLIENTE',
        },
      });
      const payload = { email: user.email, sub: user.id, role: user.role, marketId: (user as any).marketId };
      const token = this.jwtService.sign(payload);
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          marketId: (user as any).marketId,
        },
      };
    } catch (error) {
      this.logger.error(`ERROR registering user: ${(error as Error).message}`, (error as Error).stack);
      if ((error as any)?.code === 'P2002') {
        throw new Error('Email já cadastrado');
      }
      throw new Error('Erro ao criar conta');
    }
  }
}
