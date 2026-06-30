export interface MarketAvailability {
  isOpenNow: boolean;
  deliveryAvailableNow: boolean;
  pickupAvailableNow: boolean;
  unavailableReason: string | null;
}

export interface MarketData {
  isActive: boolean;
  openTime: string | null;
  closeTime: string | null;
  acceptsDelivery: boolean;
  acceptsPickup: boolean;
  deliveryStartTime?: string | null;
  deliveryEndTime?: string | null;
}

export function timeToMinutes(timeStr: string | null): number {
  if (!timeStr) return -1;
  const [hours, minutes] = timeStr.split(':').map(Number);
  return hours * 60 + minutes;
}

export function isCurrentTimeWithinRange(
  startTime: string | null,
  endTime: string | null,
  now: Date
): boolean {
  if (!startTime || !endTime) return true;

  const startMinutes = timeToMinutes(startTime);
  const endMinutes = timeToMinutes(endTime);
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  // Handle case where market closes after midnight (e.g., 18:00 to 02:00)
  if (endMinutes < startMinutes) {
    return currentMinutes >= startMinutes || currentMinutes <= endMinutes;
  }

  return currentMinutes >= startMinutes && currentMinutes <= endMinutes;
}

export function calculateMarketAvailability(market: MarketData): MarketAvailability {
  const now = new Date();
  const isActive = market.isActive ?? false;
  const openTime = market.openTime;
  const closeTime = market.closeTime;
  const acceptsDelivery = market.acceptsDelivery ?? false;
  const acceptsPickup = market.acceptsPickup ?? false;
  const deliveryStartTime = market.deliveryStartTime;
  const deliveryEndTime = market.deliveryEndTime;

  const isOpenNow = isActive && isCurrentTimeWithinRange(openTime, closeTime, now);
  const deliveryAvailableNow = isOpenNow && acceptsDelivery && isCurrentTimeWithinRange(deliveryStartTime || openTime, deliveryEndTime || closeTime, now);
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