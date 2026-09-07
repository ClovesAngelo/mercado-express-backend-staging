import { BadRequestException } from '@nestjs/common';
import { Market } from '@prisma/client';
import { OrderStatus } from './dto/update-order-status.dto';

export function isWithinDeliveryTime(
  market: Pick<Market, 'deliveryStartTime' | 'deliveryEndTime'>,
): boolean {
  if (!market.deliveryStartTime || !market.deliveryEndTime) return true;

  const now = new Date();
  const currentTime = now.getHours() * 60 + now.getMinutes();
  const [startH, startM] = market.deliveryStartTime.split(':').map(Number);
  const [endH, endM] = market.deliveryEndTime.split(':').map(Number);
  return currentTime >= startH * 60 + startM && currentTime <= endH * 60 + endM;
}

const allowedTransitions: Record<string, readonly OrderStatus[]> = {
  PENDING: ['CONFIRMED', 'CANCELLED'],
  CONFIRMED: ['PREPARING', 'CANCELLED'],
  PREPARING: ['OUT_FOR_DELIVERY', 'READY_FOR_PICKUP', 'CANCELLED'],
  OUT_FOR_DELIVERY: ['DELIVERED'],
  READY_FOR_PICKUP: ['DELIVERED'],
  DELIVERED: [],
  CANCELLED: [],
};

export function assertOrderStatusTransition(
  currentStatus: string,
  nextStatus: OrderStatus,
): void {
  if (
    currentStatus !== nextStatus &&
    !allowedTransitions[currentStatus]?.includes(nextStatus)
  ) {
    throw new BadRequestException(
      `Não é permitido alterar um pedido de ${currentStatus} para ${nextStatus}.`,
    );
  }
}
