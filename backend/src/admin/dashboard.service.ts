import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

interface CacheEntry {
  data: any;
  timestamp: number;
}

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);
  private cache: CacheEntry | null = null;
  private readonly CACHE_TTL = 30000; // 30 segundos

  constructor(private prisma: PrismaService) {}

  private isCacheValid(): boolean {
    if (!this.cache) return false;
    return Date.now() - this.cache.timestamp < this.CACHE_TTL;
  }

  private async safeQuery<T>(query: Promise<T>, fallback: T): Promise<T> {
    try {
      return await query;
    } catch (err) {
      this.logger.error(`Dashboard query failed: ${(err as Error)?.message}`);
      return fallback;
    }
  }

  async getGeneralStats() {
    if (this.isCacheValid()) {
      this.logger.log('Dashboard: retornando cache');
      return this.cache!.data;
    }

    this.logger.log('Dashboard: iniciando getGeneralStats()');
    const startTime = Date.now();

    const totalMarkets = await this.safeQuery(
      this.prisma.market.count({ where: { deletedAt: null } }),
      0
    );
    const activeMarkets = await this.safeQuery(
      this.prisma.market.count({ where: { isActive: true, deletedAt: null } }),
      0
    );
    const inactiveMarkets = await this.safeQuery(
      this.prisma.market.count({ where: { isActive: false, deletedAt: null } }),
      0
    );
    const totalClients = await this.safeQuery(
      this.prisma.user.count({ where: { role: 'CLIENTE', deletedAt: null } }),
      0
    );
    const totalManagers = await this.safeQuery(
      this.prisma.user.count({ where: { role: 'GESTOR_MERCADO', deletedAt: null } }),
      0
    );
    const pendingOrders = await this.safeQuery(
      this.prisma.order.count({ where: { status: 'PENDING', deletedAt: null } }),
      0
    );
    const deliveredOrders = await this.safeQuery(
      this.prisma.order.count({ where: { status: 'DELIVERED', deletedAt: null } }),
      0
    );
    const cancelledOrders = await this.safeQuery(
      this.prisma.order.count({ where: { status: 'CANCELLED', deletedAt: null } }),
      0
    );
    const totalRevenue = await this.safeQuery(
      this.prisma.order.aggregate({
        where: { status: 'DELIVERED', deletedAt: null },
        _sum: { total: true },
      }),
      { _sum: { total: null } }
    );

    const result = {
      markets: {
        total: totalMarkets,
        active: activeMarkets,
        inactive: inactiveMarkets,
      },
      users: {
        clients: totalClients,
        managers: totalManagers,
      },
      orders: {
        pending: pendingOrders,
        delivered: deliveredOrders,
        cancelled: cancelledOrders,
      },
      revenue: {
        total: (totalRevenue as any)?._sum?.total ?? 0,
      },
    };

    const elapsed = Date.now() - startTime;
    this.logger.log(`Dashboard: concluído em ${elapsed}ms`);

    this.cache = { data: result, timestamp: Date.now() };

    return result;
  }

  async getMarketStats(marketId: string) {
    this.logger.log(`Dashboard: iniciando getMarketStats(${marketId})`);
    const startTime = Date.now();

    const totalProducts = await this.safeQuery(
      this.prisma.product.count({ where: { marketId, deletedAt: null } }),
      0
    );
    const activeProducts = await this.safeQuery(
      this.prisma.product.count({ where: { marketId, isActive: true, deletedAt: null } }),
      0
    );
    const totalOrders = await this.safeQuery(
      this.prisma.order.count({ where: { marketId, deletedAt: null } }),
      0
    );
    const pendingOrders = await this.safeQuery(
      this.prisma.order.count({ where: { marketId, status: 'PENDING', deletedAt: null } }),
      0
    );
    const deliveredOrders = await this.safeQuery(
      this.prisma.order.count({ where: { marketId, status: 'DELIVERED', deletedAt: null } }),
      0
    );
    const revenue = await this.safeQuery(
      this.prisma.order.aggregate({
        where: { marketId, status: 'DELIVERED', deletedAt: null },
        _sum: { total: true },
      }),
      { _sum: { total: null } }
    );

    const result = {
      products: {
        total: totalProducts,
        active: activeProducts,
      },
      orders: {
        total: totalOrders,
        pending: pendingOrders,
        delivered: deliveredOrders,
      },
      revenue: {
        total: (revenue as any)?._sum?.total ?? 0,
      },
    };

    const elapsed = Date.now() - startTime;
    this.logger.log(`Dashboard: getMarketStats concluído em ${elapsed}ms`);

    return result;
  }

  invalidateCache() {
    this.cache = null;
  }
}