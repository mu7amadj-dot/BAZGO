import postgres from 'npm:postgres@3.4.7';
import { createClient } from 'npm:@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

// Only authenticated users can initialize ONE fixed autonomous job. Callers cannot
// choose SQL, database, credentials, schedule, target or role. No secrets are returned.
let initialization: Promise<{ ready: boolean; cadence: string }> | null = null;
const delay = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));
async function initialize() {
  const connection = Deno.env.get('SUPABASE_DB_URL');
  if (!connection) throw new Error('Database scheduling credentials are unavailable');
  const url = new URL(connection);
  const database = decodeURIComponent(url.pathname.slice(1));
  if (!database) throw new Error('Database name is unavailable');
  url.pathname = '/postgres';
  const sql = postgres(url.toString(), { max: 1, prepare: false, connect_timeout: 10, idle_timeout: 5 });
  let cadence = '10 seconds';
  try {
    await sql`create extension if not exists pg_cron`;
    try {
      await sql`select cron.schedule_in_database('bazgo-expire-negotiations', ${cadence}, 'select public.bazgo_expiry_tick()', ${database})`;
    } catch {
      cadence = '* * * * *';
      await sql`select cron.schedule_in_database('bazgo-expire-negotiations', ${cadence}, 'select public.bazgo_expiry_tick()', ${database})`;
    }
    const jobs = await sql`select jobid from cron.job where jobname = 'bazgo-expire-negotiations' and database = ${database} and active`;
    if (!jobs.length) throw new Error('Expiry job was not activated');
  } finally { await sql.end({ timeout: 5 }); }
  // Crucially, only the actual cron tick writes readiness. Creating a job alone is
  // not proof that it runs or can authenticate to this application's database.
  const admin = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
  const deadline = Date.now() + (cadence === '10 seconds' ? 30000 : 65000);
  while (Date.now() < deadline) {
    const { data, error } = await admin.from('bazgo_runtime').select('ready,checked_at').eq('key', 'expiry_scheduler').maybeSingle();
    if (error) throw new Error('Unable to inspect server scheduler readiness');
    if (data?.ready && new Date(data.checked_at).getTime() > Date.now() - 90000) {
      console.log('BAZGO autonomous expiry heartbeat verified');
      return { ready: true, cadence };
    }
    await delay(1000);
  }
  throw new Error('Expiry job has not produced a heartbeat');
}
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const headers = { ...corsHeaders, 'Content-Type': 'application/json' };
  const auth = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_ANON_KEY') ?? '');
  const token = req.headers.get('Authorization')?.replace(/^Bearer\s+/i, '');
  if (!token) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers });
  const { data: { user }, error: authError } = await auth.auth.getUser(token);
  if (authError || !user) return new Response(JSON.stringify({ error: 'Authentication required' }), { status: 401, headers });
  try {
    if (!initialization) initialization = initialize().catch((error) => { initialization = null; throw error; });
    const result = await initialization;
    return new Response(JSON.stringify(result), { headers });
  } catch {
    console.error('BAZGO expiry heartbeat verification failed; administrator setup required');
    return new Response(JSON.stringify({ ready: false, error: 'Autonomous server expiry is not verified. An administrator must enable and verify the pg_cron job before bookings can start.' }), { status: 503, headers });
  }
});
