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
    const markets = await this.prisma.market.findMany({
      include: {
        products: true,
        managers: {
          where: { role: 'GESTOR_MERCADO' },
          select: { id: true, name: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return markets.map(market => ({
      ...market,
      ...this.getMarketAvailability(market),
    }));
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

  private isWithinTimeRange(timeStr: string | null, startStr: string | null, endStr: string | null): boolean {
    if (!timeStr || !startStr || !endStr) return true;
    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const [startH, startM] = startStr.split(':').map(Number);
    const [endH, endM] = endStr.split(':').map(Number);
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;
    return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
  }

  private getMarketAvailability(market: any) {
    const isActive = market.isActive ?? false;
    const openTime = market.openTime;
    const closeTime = market.closeTime;
    const acceptsDelivery = market.acceptsDelivery ?? false;
    const acceptsPickup = market.acceptsPickup ?? false;
    const deliveryStartTime = market.deliveryStartTime;
    const deliveryEndTime = market.deliveryEndTime;

    const isOpenNow = isActive && this.isWithinTimeRange(openTime, openTime, closeTime);
    const deliveryAvailableNow = isOpenNow && acceptsDelivery && this.isWithinTimeRange(deliveryStartTime, deliveryStartTime, deliveryEndTime);
    const pickupAvailableNow = isOpenNow && acceptsPickup;

    let unavailableReason: string | null = null;
    if (!isActive) {
      unavailableReason = 'Mercado desativado';
    } else if (!isOpenNow) {
      unavailableReason = 'Fora do horário de funcionamento';
    } else if (!acceptsDelivery && !acceptsPickup) {
      unavailableReason = 'Nenhuma forma de atendimento disponível';
    } else if (!deliveryAvailableNow && !pickupAvailableNow) {
      unavailableReason = 'Nenhuma forma de atendimento disponível no momento';
    }

    return {
      isOpenNow,
      deliveryAvailableNow,
      pickupAvailableNow,
      unavailableReason,
    };
  }

  async findOnePublic(id: string) {
    const market = await this.prisma.market.findUnique({
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

    if (!market) return null;

    const availability = this.getMarketAvailability(market);

    return {
      ...market,
      ...availability,
    };
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
