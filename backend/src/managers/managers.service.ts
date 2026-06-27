import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class ManagersService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { role: 'GESTOR_MERCADO' },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        marketId: true,
        market: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        marketId: true,
        market: {
          select: { id: true, name: true },
        },
      },
    });
    if (!manager) throw new NotFoundException('Gestor não encontrado');
    return manager;
  }

  async create(data: { name: string; email: string; password: string; marketId?: string | null }) {
    // Verificar se email já existe
    const existingUser = await this.prisma.user.findUnique({
      where: { email: data.email },
    });
    if (existingUser) {
      throw new ConflictException('Email já cadastrado');
    }

    // Se for vincular a um mercado, verificar se o mercado existe
    if (data.marketId) {
      const market = await this.prisma.market.findUnique({
        where: { id: data.marketId },
      });
      if (!market) {
        throw new NotFoundException('Mercado não encontrado');
      }

      // NOTA: Não desvinculamos outros gestores - múltiplos gestores podem ter o mesmo marketId
    }

    // Hash da senha antes de salvar
    const hashedPassword = await bcrypt.hash(data.password, 10);

    const manager = await this.prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        role: 'GESTOR_MERCADO',
        marketId: data.marketId ?? null,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        marketId: true,
        market: {
          select: { id: true, name: true },
        },
      },
    });

    // NOTA: Não atualizamos mais Market.managerId
    // A fonte de verdade é User.marketId
    // Múltiplos gestores podem ter o mesmo marketId

    return manager;
  }

  async update(id: string, data: { name?: string; email?: string; marketId?: string | null }) {
    const manager = await this.prisma.user.findUnique({
      where: { id },
      include: { market: true },
    });
    if (!manager) throw new NotFoundException('Gestor não encontrado');

    // Verificar se email já existe em outro usuário
    if (data.email && data.email !== manager.email) {
      const existingUser = await this.prisma.user.findUnique({
        where: { email: data.email },
      });
      if (existingUser) {
        throw new ConflictException('Email já cadastrado em outro usuário');
      }
    }

    // Se marketId mudou, gerenciar vínculos
    if (data.marketId !== undefined && data.marketId !== manager.marketId) {
      // Se novo marketId foi informado, verificar se mercado existe
      if (data.marketId) {
        const market = await this.prisma.market.findUnique({
          where: { id: data.marketId },
        });
        if (!market) {
          throw new NotFoundException('Mercado não encontrado');
        }

        // NOTA: Não desvinculamos outros gestores - múltiplos gestores podem ter o mesmo marketId
      }
    }

    // Atualizar gestor
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        name: data.name,
        email: data.email,
        marketId: data.marketId ?? null,
      },
      include: {
        market: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      marketId: updated.marketId,
      market: updated.market,
    };
  }

  async remove(id: string) {
    const manager = await this.prisma.user.findUnique({
      where: { id },
      include: { market: true },
    });
    if (!manager) throw new NotFoundException('Gestor não encontrado');

    // Desvincular do mercado se existir
    if (manager.marketId) {
      await this.prisma.market.update({
        where: { id: manager.marketId },
        data: { managerId: null },
      });
    }

    // Deletar gestor
    await this.prisma.user.delete({
      where: { id },
    });

    return { message: 'Gestor removido com sucesso' };
  }
}