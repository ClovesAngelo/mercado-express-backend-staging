import { Injectable, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class MarketsService {
  constructor(private prisma: PrismaService) {}

  async create(data: any) {
    return this.prisma.market.create({
      data: {
        name: data.name,
        address: data.address,
        description: data.description,
        phone: data.phone,
        imageUrl: data.imageUrl,
      },
    });
  }

  async createWithManager(marketData: any, managerData: any) {
    const hashedPassword = await bcrypt.hash(managerData.password, 10);

    return this.prisma.$transaction(async (tx) => {
      const market = await tx.market.create({
        data: {
          name: marketData.name,
          address: marketData.address,
          description: marketData.description,
          phone: marketData.phone,
          imageUrl: marketData.imageUrl,
        },
      });

      const manager = await tx.user.create({
        data: {
          email: managerData.email,
          name: managerData.name,
          password: hashedPassword,
          role: 'GESTOR_MERCADO',
          marketId: market.id,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          marketId: true,
        },
      });

      // NOTA: Não atualizamos mais Market.managerId
      // A fonte de verdade é User.marketId
      // Múltiplos gestores podem ter o mesmo marketId

      return {
        market,
        manager,
      };
    });
  }

  async findAll() {
    return this.prisma.market.findMany({
      include: {
        products: true,
        managers: {
          where: { role: 'GESTOR_MERCADO' },
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findAllWithManager() {
    return this.prisma.market.findMany({
      include: {
        managers: {
          where: { role: 'GESTOR_MERCADO' },
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.market.findUnique({
      where: { id },
      include: {
        products: true,
        managers: {
          where: { role: 'GESTOR_MERCADO' },
          select: { id: true, name: true, email: true },
        },
      },
    });
  }

  async setActive(id: string, isActive: boolean) {
    return this.prisma.market.update({
      where: { id },
      data: { isActive },
    });
  }

  async remove(id: string) {
    return this.prisma.market.delete({
      where: { id },
    });
  }

  async update(id: string, data: any, user: any) {
    // Gestor só pode atualizar campos específicos
    if (user.role === 'GESTOR_MERCADO') {
      const allowedFields = ['name', 'description', 'phone', 'address', 'imageUrl', 'whatsapp', 'openTime', 'closeTime', 'logoUrl', 'bannerUrl'];
      const filteredData = Object.keys(data)
        .filter(key => allowedFields.includes(key))
        .reduce((acc, key) => ({ ...acc, [key]: data[key] }), {});

      return this.prisma.market.update({
        where: { id },
        data: filteredData,
      });
    }

    // Admin pode atualizar tudo
    return this.prisma.market.update({
      where: { id },
      data,
    });
  }
}