// Powered by OnSpace.AI
import { useMemo, useState } from 'react';
import { useApp } from '@/hooks/useApp';
import { getActivePublishedRequests, getDriverHomeRequests, matchesDriverProfile } from '@/services/freightOverviewService';
import { PROVINCES } from '@/constants/config';

export function useFreightOverview() {
  const { role, merchantName, driverName, requests, driverProfile } = useApp();
  const isMerchant = role === 'merchant';
  const [province, setProvince] = useState('all');
  const provinceItems = useMemo(() => [
    { id: 'all', label: 'عرض الكل', icon: 'map-marker-outline' },
    ...PROVINCES.map((name) => ({ id: name, label: name, icon: 'map-marker-outline' })),
  ], []);
  const matchedIds = useMemo(() => new Set(isMerchant ? [] : requests.filter((request) => matchesDriverProfile(request, driverProfile)).map((request) => request.id)), [isMerchant, requests, driverProfile]);
  const openCount = useMemo(() => requests.filter((request) => request.status === 'open' || request.status === 'applications' || request.status === 'available' || request.status === 'negotiating').length, [requests]);
  const featuredRequests = useMemo(() => isMerchant ? getActivePublishedRequests(requests) : getDriverHomeRequests(requests, province), [isMerchant, requests, province]);
  const provinceLabel = province === 'all' ? 'كل المحافظات' : province;
  return { isMerchant, name: isMerchant ? merchantName : driverName, openCount, matchedCount: matchedIds.size, matchedIds, featuredRequests, province, setProvince, provinceItems, provinceLabel };
}
