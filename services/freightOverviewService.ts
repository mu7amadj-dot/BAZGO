// Powered by OnSpace.AI
import type { DriverProfile, FreightRequest, RequestStatus } from './types';

// Published requests remain active until delivery, completion, or cancellation.
const activeRequestStatuses: ReadonlySet<RequestStatus> = new Set<RequestStatus>([
  'available', 'open', 'applications', 'selected', 'negotiating', 'confirmed', 'in_transit',
]);

// Match either end of the freight route, consistent with the existing province filter.
export function getDriverHomeRequests(requests: FreightRequest[], province: string): FreightRequest[] {
  if (province === 'all') return requests;
  return requests.filter((request) => request.pickupProvince === province || request.deliveryProvince === province);
}

export function matchesDriverProfile(request: FreightRequest, profile: DriverProfile): boolean {
  const capacity = Number(profile.maxCapacity);
  return Number.isFinite(capacity) && capacity > 0 && capacity >= request.weightTons && profile.vehicleType === request.vehicleType;
}

export function getActivePublishedRequests(requests: FreightRequest[]): FreightRequest[] {
  return requests
    .filter((request) => activeRequestStatuses.has(request.status))
    .sort((first, second) => second.createdAt - first.createdAt);
}
