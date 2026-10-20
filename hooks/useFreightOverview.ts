// Powered by OnSpace.AI
import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { matchDrivers } from '@/services/matchingService';
import { getActivePublishedRequests } from '@/services/freightOverviewService';

export function useFreightOverview() {
  const { role, merchantName, driverName, requests, drivers, applications } = useApp();
  const isMerchant = role === 'merchant';
  const matchedIds = useMemo(() => new Set(requests.filter((request) => matchDrivers(request, drivers).length > 0).map((request) => request.id)), [requests, drivers]);
  const openCount = useMemo(() => requests.filter((request) => request.status === 'open' || request.status === 'applications' || request.status === 'available' || request.status === 'negotiating').length, [requests]);
  const featuredRequests = useMemo(() => isMerchant ? getActivePublishedRequests(requests) : requests.slice(0, 3), [isMerchant, requests]);
  return { isMerchant, name: isMerchant ? merchantName : driverName, openCount, matchedCount: matchedIds.size, applicationCount: applications.length, matchedIds, featuredRequests };
}
