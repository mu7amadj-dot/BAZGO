// Powered by OnSpace.AI
import { useMemo } from 'react';
import { useApp } from '@/hooks/useApp';
import { matchDrivers } from '@/services/matchingService';

export function useFreightOverview() {
  const { role, merchantName, driverName, requests, drivers, applications } = useApp();
  const isMerchant = role === 'merchant';
  const matchedIds = useMemo(() => new Set(requests.filter((request) => matchDrivers(request, drivers).length > 0).map((request) => request.id)), [requests, drivers]);
  const openCount = useMemo(() => requests.filter((request) => request.status === 'open' || request.status === 'applications').length, [requests]);
  const featuredRequests = useMemo(() => requests.slice(0, 3), [requests]);
  return { isMerchant, name: isMerchant ? merchantName : driverName, openCount, matchedCount: matchedIds.size, applicationCount: applications.length, matchedIds, featuredRequests };
}
