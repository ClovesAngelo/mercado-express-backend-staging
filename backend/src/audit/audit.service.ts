import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuditService {
  private readonly logger = new Logger(AuditService.name);

  constructor(private prisma: PrismaService) {}

  async log(params: {
    userId: string;
    userName: string;
    userEmail: string;
    action: string;
    entity: string;
    entityId?: string;
    oldValues?: unknown;
    newValues?: unknown;
    ipAddress?: string;
    userAgent?: string;
  }) {
    try {
      await this.prisma.auditLog.create({
        data: {
          userId: params.userId,
          userName: params.userName,
          userEmail: params.userEmail,
          action: params.action,
          entity: params.entity,
          entityId: params.entityId,
          oldValues: params.oldValues as Prisma.InputJsonValue | undefined,
          newValues: params.newValues as Prisma.InputJsonValue | undefined,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to create audit log: ${(error as Error).message}`,
      );
    }
  }
}
