// Powered by OnSpace.AI
// BAZGO smart matching (mock logic)

import { Driver, FreightRequest } from './types';

export interface MatchResult {
  driver: Driver;
  score: number;
  reasons: string[];
}

// Score a driver against a freight request
export function scoreDriver(req: FreightRequest, driver: Driver): MatchResult {
  let score = 0;
  const reasons: string[] = [];

  if (driver.vehicleType === req.vehicleType) {
    score += 40;
    reasons.push('نوع المركبة مطابق');
  }
  if (driver.maxCapacity >= req.weightTons) {
    score += 25;
    reasons.push('السعة كافية للحمولة');
  }
  if (driver.province === req.pickupProvince) {
    score += 20;
    reasons.push('قريب من موقع التحميل');
  }
  if (driver.verified) {
    score += 10;
    reasons.push('سائق موثّق');
  }
  score += Math.min(5, driver.rating);

  return { driver, score, reasons };
}

// Return matched drivers sorted by score, only those that can carry the load
export function matchDrivers(req: FreightRequest, drivers: Driver[]): MatchResult[] {
  return drivers
    .filter((d) => d.maxCapacity >= req.weightTons && d.verified)
    .map((d) => scoreDriver(req, d))
    .sort((a, b) => b.score - a.score);
}

export function isGoodMatch(req: FreightRequest, driver: Driver): boolean {
  return (
    driver.verified &&
    driver.maxCapacity >= req.weightTons &&
    driver.vehicleType === req.vehicleType
  );
}
