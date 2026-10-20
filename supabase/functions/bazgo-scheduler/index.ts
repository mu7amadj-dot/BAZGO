import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Read-only readiness probe. Provisioning belongs to the database administrator,
// not an arbitrary signed-in user's request. This endpoint never runs a tick,
// creates a job, writes a heartbeat, or returns database credentials.
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' };
  const respond = (body: Record<string, unknown>, status = 200) =>
    new Response(JSON.stringify(body), { status, headers });
  if (req.method !== 'POST') return respond({ error: 'Method not allowed' }, 405);
  try {
    const url = Deno.env.get('SUPABASE_URL');
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !anonKey || !serviceKey) {
      console.error('BAZGO scheduler probe: required backend environment is incomplete');
      return respond({ ready: false, code: 'backend_configuration_missing', error: 'Server scheduler configuration is incomplete.' }, 503);
    }
    const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
    if (!token) return respond({ error: 'Authentication required' }, 401);
    const auth = createClient(url, anonKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data: { user }, error: authError } = await auth.auth.getUser(token);
    if (authError || !user) return respond({ error: 'Authentication required' }, 401);
    const admin = createClient(url, serviceKey, { auth: { persistSession: false, autoRefreshToken: false } });
    const { data, error } = await admin.rpc('bazgo_scheduler_status');
    if (error) {
      // Log safe classifications only: never include connection URLs, keys or raw
      // driver errors that may contain credentials. Detailed SQL is in the runbook.
      console.error('BAZGO scheduler status RPC failed', { code: error.code });
      return respond({ ready: false, code: 'scheduler_status_unavailable', error: 'Server scheduler status is unavailable. Apply the scheduler verification migration and check its service-role grant.' }, 503);
    }
    if (!data?.ready) {
      console.warn('BAZGO autonomous scheduler not verified', { reason: data?.reason ?? 'missing_status', checkedAt: data?.checkedAt ?? null });
      return respond({ ...data, ready: false, code: data?.reason ?? 'missing_status', error: 'Autonomous server expiry is not verified. A database administrator must configure the dedicated pg_cron job and verify two recurring ticks. See docs/BOOKING_SCHEDULER.md.' }, 503);
    }
    return respond({ ...data, ready: true });
  } catch {
    console.error('BAZGO scheduler readiness request failed');
    return respond({ ready: false, code: 'scheduler_probe_failed', error: 'Unable to verify the server expiry scheduler. Please retry; an administrator should inspect backend logs if this persists.' }, 503);
  }
});
