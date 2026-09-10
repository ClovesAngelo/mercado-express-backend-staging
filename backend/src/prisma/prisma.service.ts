import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log(
        `[PrismaService] Conectado a Postgres (host: ${this.getConnectedHost()})`,
      );
    } catch (error) {
      // Não derribar a aplicação: o endpoint /health/ready reportará "disconnected"
      // e o resto das rotas devolverá erro 500 com a causa real nos logs.
      this.logger.error(
        `[PrismaService] No se pudo conectar a Postgres: ${(error as Error).message}`,
      );
      this.logger.warn(
        '[PrismaService] La aplicación seguirá arrancando en modo degradado. ' +
          'Verifique DATABASE_URL (host, puerto y red: se usa el host directo db.<ref>.supabase.co que requiere IPv6, ' +
          'o el pooler aws-<region>.pooler.supabase.com que funciona por IPv4).',
      );
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }

  private getConnectedHost(): string {
    try {
      const url = process.env.DATABASE_URL ?? '';
      const at = url.lastIndexOf('@');
      if (at === -1) return '(no configurado)';
      const hostPort = url.slice(at + 1).split('/')[0];
      return hostPort;
    } catch {
      return '(desconocido)';
    }
  }
}
