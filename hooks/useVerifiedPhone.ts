import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/template';
import { fetchVerifiedPhone } from '@/services/phoneAuthService';

export function useVerifiedPhone() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [attempt, setAttempt] = useState(0);
  const [state, setState] = useState<{ owner: string | null; phone: string; error: string }>({ owner: null, phone: '', error: '' });
  useEffect(() => {
    let active = true;
    if (!userId) { setState({ owner: null, phone: '', error: '' }); return; }
    setState({ owner: null, phone: '', error: '' });
    void fetchVerifiedPhone().then((phone) => {
      if (active) setState({ owner: userId, phone, error: '' });
    }).catch((issue) => {
      if (active) setState({ owner: userId, phone: '', error: issue instanceof Error ? issue.message : 'تعذر تحميل رقم الهاتف.' });
    });
    return () => { active = false; };
  }, [userId, attempt]);
  const retry = useCallback(() => setAttempt((value) => value + 1), []);
  return { phone: state.owner === userId ? state.phone : '', error: state.owner === userId ? state.error : '', loading: !!userId && state.owner !== userId, retry };
}
