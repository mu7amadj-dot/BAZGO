import React, { createContext, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState } from 'react-native';
import { useAuth } from '@/template';
import { cancelServerLoad, createServerLoad, fetchMarketSnapshot, markServerNotifications, negotiationAction, reserveServerLoad, setupMarketAccount } from '@/services/bookingService';
import type { MarketSnapshot, NegotiationAction } from '@/services/bookingTypes';
import type { FreightRequest, UserRole } from '@/services/types';

const emptySnapshot: MarketSnapshot = { account: null, serverNow: '', loads: [], negotiations: [], messages: [], ratings: [], notifications: [] };
const monotonicNow = () => typeof performance !== 'undefined' ? performance.now() : Date.now();
export interface BookingContextType extends MarketSnapshot {
  userId: string | null; authenticated: boolean; loading: boolean; syncError: string; now: number;
  reload: () => Promise<void>;
  setupAccount: (role: UserRole, name: string, profile?: Record<string, string>) => Promise<void>;
  reserve: (loadId: string) => Promise<string>;
  act: (id: string, action: NegotiationAction, value?: Record<string, unknown>) => Promise<void>;
  createLoad: (request: FreightRequest) => Promise<void>;
  cancelLoad: (loadId: string) => Promise<void>;
  markRead: () => Promise<void>;
}
export const BookingContext = createContext<BookingContextType | undefined>(undefined);
export function BookingProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [snapshot, setSnapshot] = useState<MarketSnapshot>(emptySnapshot);
  const [snapshotOwner, setSnapshotOwner] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [syncError, setSyncError] = useState('');
  const [now, setNow] = useState(0);
  const anchor = useRef({ server: 0, local: monotonicNow() });
  const generation = useRef(0);
  const pending = useRef<Promise<void> | null>(null);
  const reload = useCallback(async (): Promise<void> => {
    const ticket = generation.current;
    if (!userId) return;
    const predecessor = pending.current;
    const request = (async () => {
      if (predecessor) await predecessor;
      if (ticket !== generation.current) return;
      try {
        const data = await fetchMarketSnapshot();
        if (ticket !== generation.current) return;
        anchor.current = { server: new Date(data.serverNow).getTime(), local: monotonicNow() };
        setNow(anchor.current.server);
        setSnapshot(data); setSnapshotOwner(userId); setSyncError('');
      } catch (error) {
        if (ticket === generation.current) setSyncError(error instanceof Error ? error.message : 'Unable to synchronize with the server');
      } finally { if (ticket === generation.current) setLoading(false); }
    })();
    pending.current = request;
    await request;
    if (pending.current === request) pending.current = null;
  }, [userId]);
  useEffect(() => {
    generation.current += 1; pending.current = null;
    setSnapshot(emptySnapshot); setSnapshotOwner(null); setSyncError(''); setNow(0); anchor.current.server = 0;
    if (!userId) { setLoading(false); return; }
    setLoading(true); void reload();
    const poll = setInterval(() => { if (!pending.current && AppState.currentState !== 'background') void reload(); }, 3000);
    const timer = setInterval(() => { if (anchor.current.server) setNow(anchor.current.server + Math.max(0, monotonicNow() - anchor.current.local)); }, 1000);
    const listener = AppState.addEventListener('change', (state) => { if (state === 'active') void reload(); });
    return () => { generation.current += 1; clearInterval(poll); clearInterval(timer); listener.remove(); };
  }, [userId, reload]);
  const setupAccount = useCallback(async (role: UserRole, name: string, profile: Record<string, string> = {}) => {
    await setupMarketAccount(role, name, profile); await reload();
  }, [reload]);
  const reserve = useCallback(async (loadId: string) => { const n = await reserveServerLoad(loadId); await reload(); return n.id; }, [reload]);
  const act = useCallback(async (id: string, action: NegotiationAction, value: Record<string, unknown> = {}) => {
    try { await negotiationAction(id, action, value); } finally { await reload(); }
  }, [reload]);
  const createLoad = useCallback(async (request: FreightRequest) => {
    if (!userId) throw new Error('Authenticated merchant account required');
    await createServerLoad(request, userId); await reload();
  }, [reload, userId]);
  const cancelLoad = useCallback(async (id: string) => { await cancelServerLoad(id); await reload(); }, [reload]);
  const markRead = useCallback(async () => { await markServerNotifications(); await reload(); }, [reload]);
  // Never render a previous user's private snapshot while a new session initializes.
  const value = useMemo<BookingContextType>(() => ({
    ...(snapshotOwner === userId ? snapshot : emptySnapshot), userId, authenticated: !!userId,
    loading: loading || (!!userId && snapshotOwner !== userId && !syncError), syncError,
    now: snapshotOwner === userId ? now : 0,
    reload, setupAccount, reserve, act, createLoad, cancelLoad, markRead,
  }), [snapshot, snapshotOwner, userId, loading, syncError, now, reload, setupAccount, reserve, act, createLoad, cancelLoad, markRead]);
  return <BookingContext.Provider value={value}>{children}</BookingContext.Provider>;
}
