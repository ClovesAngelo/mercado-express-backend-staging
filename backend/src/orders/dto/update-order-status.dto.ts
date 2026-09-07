import { IsIn } from 'class-validator';

export const ORDER_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'OUT_FOR_DELIVERY',
  'READY_FOR_PICKUP',
  'DELIVERED',
  'CANCELLED',
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

export class UpdateOrderStatusDto {
  @IsIn(ORDER_STATUSES, { message: 'Status de pedido inválido.' })
  status!: OrderStatus;
}
