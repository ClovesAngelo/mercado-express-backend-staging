import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { UserRole, type User } from '@prisma/client';
import { RegisterDto } from './dto/register.dto';
import { AuthenticatedUser } from '../types/express';

type UserWithoutPassword = Omit<User, 'password'>;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validateUser(
    email: string,
    password: string,
  ): Promise<UserWithoutPassword | null> {
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
      const { password: _password, ...result } = user;
      void _password;
      return result;
    } catch (error) {
      this.logger.error(
        `ERROR validating user: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw error;
    }
  }

  // eslint-disable-next-line @typescript-eslint/require-await -- login assina o JWT síncrono mas expõe Promise p/ controller.
  async login(user: UserWithoutPassword & { marketId?: string | null }) {
    try {
      this.logger.log(`Generating token for: ${user.email}`);
      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
        marketId: user.marketId,
      };
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
      this.logger.error(
        `ERROR generating token: ${(error as Error).message}`,
        (error as Error).stack,
      );
      throw new UnauthorizedException('Erro ao gerar token de acesso');
    }
  }

  async register(
    createUserDto: RegisterDto,
  ): Promise<{ access_token: string; user: AuthenticatedUser }> {
    try {
      this.logger.log(`Registering user: ${createUserDto.email}`);
      const hashedPassword = await bcrypt.hash(createUserDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email: createUserDto.email,
          name: createUserDto.name,
          password: hashedPassword,
          // O cadastro público nunca pode escolher uma função privilegiada.
          role: UserRole.CLIENTE,
        },
      });
      const payload = {
        email: user.email,
        sub: user.id,
        role: user.role,
        marketId: user.marketId ?? null,
      };
      const token = this.jwtService.sign(payload);
      return {
        access_token: token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          marketId: user.marketId ?? null,
        },
      };
    } catch (error) {
      this.logger.error(
        `ERROR registering user: ${(error as Error).message}`,
        (error as Error).stack,
      );
      const prismaError = error as { code?: string };
      if (prismaError.code === 'P2002') {
        throw new Error('Email já cadastrado');
      }
      throw new Error('Erro ao criar conta');
    }
  }
}
