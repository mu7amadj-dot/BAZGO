// Powered by OnSpace.AI
import type { FreightRequest, RequestStatus } from './types';

// Published requests remain active until delivery, completion, or cancellation.
const activeRequestStatuses: ReadonlySet<RequestStatus> = new Set<RequestStatus>([
  'available', 'open', 'applications', 'selected', 'negotiating', 'confirmed', 'in_transit',
]);

export function getActivePublishedRequests(requests: FreightRequest[]): FreightRequest[] {
  return requests
    .filter((request) => activeRequestStatuses.has(request.status))
    .sort((first, second) => second.createdAt - first.createdAt);
}
