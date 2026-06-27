import { Injectable, Logger } from '@nestjs/common';
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
    oldValues?: any;
    newValues?: any;
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
          oldValues: params.oldValues,
          newValues: params.newValues,
          ipAddress: params.ipAddress,
          userAgent: params.userAgent,
        },
      });
    } catch (error) {
      this.logger.error(`Failed to create audit log: ${(error as Error).message}`);
    }
  }
}