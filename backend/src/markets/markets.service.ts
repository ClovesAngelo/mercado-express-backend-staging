import { Injectable } from '@nestjs/common';
import { ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { rethrowPrismaError } from '../prisma/prisma-error.utils';
import * as bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { AuthenticatedUser } from '../types/express';

export interface CreateMarketInput {
  name: string;
  address: string;
  description?: string;
  phone?: string;
  imageUrl?: string;
}

export interface CreateMarketWithManagerInput {
  name: string;
  address: string;
  description?: string;
  phone?: string;
  imageUrl?: string;
  email: string;
  managerName: string;
  password: string;
}

@Injectable()
export class MarketsService {
  constructor(private prisma: PrismaService) {}

  async create(data: CreateMarketInput) {
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

  async createWithManager(
    marketData: Omit<CreateMarketInput, 'name' | 'address'> & {
      name: string;
      address: string;
    },
    managerData: { email: string; name: string; password: string },
  ) {
    const hashedPassword = await bcrypt.hash(managerData.password, 10);

    try {
      return await this.prisma.$transaction(async (tx) => {
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
    } catch (error) {
      // P2002 = email do gestor já cadastrado: responder 409 em vez de 500
      rethrowPrismaError(error, {
        conflictMessage: 'Email já cadastrado',
      });
    }
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

  async findOnePublic(id: string) {
    return this.prisma.market.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        fantasyName: true,
        companyName: true,
        address: true,
        description: true,
        phone: true,
        whatsapp: true,
        logoUrl: true,
        bannerUrl: true,
        openTime: true,
        closeTime: true,
        deliveryFee: true,
        minOrderValue: true,
        avgDeliveryTime: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
        acceptsDelivery: true,
        acceptsPickup: true,
        deliveryStartTime: true,
        deliveryEndTime: true,
        pickupInstructions: true,
        deliveryInstructions: true,
        pixEnabled: true,
        pixKey: true,
        pixKeyType: true,
        pixRecipientName: true,
        pixInstructions: true,
      },
    });
  }

  async setActive(id: string, isActive: boolean) {
    try {
      return await this.prisma.market.update({
        where: { id },
        data: { isActive },
      });
    } catch (error) {
      rethrowPrismaError(error, { notFoundMessage: 'Mercado não encontrado' });
    }
  }

  async remove(id: string) {
    try {
      return await this.prisma.market.delete({
        where: { id },
      });
    } catch (error) {
      rethrowPrismaError(error, { notFoundMessage: 'Mercado não encontrado' });
    }
  }

  async update(
    id: string,
    data: Partial<Prisma.MarketUpdateInput>,
    user: AuthenticatedUser,
  ) {
    // Gestor só pode atualizar campos específicos
    if (user.role === 'GESTOR_MERCADO') {
      if (!user.marketId || user.marketId !== id) {
        throw new ForbiddenException(
          'Você só pode atualizar o mercado ao qual está vinculado.',
        );
      }
      const allowedFields = [
        'name',
        'description',
        'phone',
        'address',
        'imageUrl',
        'whatsapp',
        'openTime',
        'closeTime',
        'logoUrl',
        'bannerUrl',
        'acceptsDelivery',
        'acceptsPickup',
        'deliveryStartTime',
        'deliveryEndTime',
        'pickupInstructions',
        'deliveryInstructions',
        'pixEnabled',
        'pixKey',
        'pixKeyType',
        'pixRecipientName',
        'pixInstructions',
      ];
      const source = data as Record<string, unknown>;
      const filteredData: Partial<Prisma.MarketUpdateInput> = {};
      for (const key of allowedFields) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          (filteredData as Record<string, unknown>)[key] = source[key];
        }
      }

      try {
        return await this.prisma.market.update({
          where: { id },
          data: filteredData,
        });
      } catch (error) {
        rethrowPrismaError(error, {
          notFoundMessage: 'Mercado não encontrado',
        });
      }
    }

    // Admin pode atualizar tudo
    try {
      return await this.prisma.market.update({
        where: { id },
        data,
      });
    } catch (error) {
      rethrowPrismaError(error, { notFoundMessage: 'Mercado não encontrado' });
    }
  }
}
