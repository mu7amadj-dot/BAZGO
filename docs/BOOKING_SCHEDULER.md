# Booking scheduler investigation and administrator runbook

## Current result — 20 October 2026

**The application migration and least-privileged worker-role setup are applied. Autonomous scheduling is NOT activated or verified. Bookings intentionally remain blocked.** An administrator with access to the cluster's `postgres` database must complete the steps below. No production loads, accounts, reservations or messages were modified during this investigation.

## Root cause and evidence

The immediate cause of the booking failure is **absence of a verified autonomous expiry heartbeat**. The old readiness probe returned HTTP 503, and `public.bazgo_runtime` contained no rows. The database booking guard correctly refused to create a reservation.

Verified configuration:

| Check | Observed result |
| --- | --- |
| Application database | `vshyveaykgkhngwyvshy` |
| SQL executor | `supabase_admin`, not a PostgreSQL superuser |
| pg_cron library | Present in `shared_preload_libraries`; extension is available |
| `cron.database_name` | `postgres` — extension/job metadata belong to the administration database |
| Extensions in application DB | Only `plpgsql` before this change; no local `cron` schema |
| App role CONNECT to `postgres` | Granted |
| App role CREATE in `postgres` | **Not granted** |
| App role CREATEROLE | Granted; dedicated application-worker setup completed |
| `cron.use_background_workers` | `off` |
| `cron.host` | `/tmp` — libpq jobs need working local authentication |
| `cron.log_run` | `on` |
| Runtime heartbeat before/after investigation | Missing; `ready=false`, `verifiedTicks=0` |
| Existing live booking duplicates | Zero |
| Production reservations | Zero at inspection |

The old Edge Function tried to install `pg_cron` and create a job by changing `SUPABASE_DB_URL` to `/postgres` during an ordinary user's booking request. That is an administrative operation the app role cannot perform if the extension is not already installed there. Changing the database name does not confer administrative privileges, and the existing libpq configuration also requires working worker authentication.

**Diagnostic limit:** the old Edge Function suppressed the actual database exception. This editor's SQL tool is connected only to the application database; it cannot inspect `postgres.cron.job` or its run logs. Therefore, whether pg_cron is already installed in `postgres`, whether a legacy job exists, and its exact failure message are not verified. Do not interpret the absence of a local extension as proof that pg_cron is unsupported. The provider administrator must inspect the queries below to distinguish installation, privileges, authentication and execution failures.

## Booking verification locations

1. `hooks/useLoadBooking.ts`: Accept Load calls `booking.reserve(loadId)` and only opens chat on success.
2. `contexts/BookingContext.tsx`: `reserve()` calls `reserveServerLoad()` and reloads the snapshot.
3. `services/bookingService.ts`: `reserveServerLoad()` awaits `ensureServerScheduler()` before the reservation RPC.
4. `supabase/functions/bazgo-scheduler/index.ts`: authenticated, **read-only** readiness probe using `bazgo_scheduler_status()`.
5. `public.bazgo_reserve_load(uuid)`: independently checks verified database status, then enters `bazgo_reserve_load_locked(uuid)`.
6. `public.bazgo_reserve_load_locked(uuid)`: load-level `for update`, exact server deadline checks, same-driver retry and exclusive reservation creation.
7. `public.bazgo_expire_negotiations()`: locks load first, negotiation second, releases only overdue temporary reservations, and notifies both parties. Confirmed bookings are excluded.

## Changes made

- Applied and saved `supabase/migrations/20261020180000_bazgo_scheduler_verification.sql`.
- Added `bazgo_scheduler_status()` and scheduler provenance metadata to the runtime table.
- Heartbeats are generated only by a **dedicated database login**, after expiry completes successfully in the same transaction. Ordinary clients, the Edge service-role API, and `SET ROLE` cannot call the tick as that login.
- Require two real worker ticks 5–90 seconds apart, with the most recent heartbeat younger than two minutes. First startup or recovery tick alone is insufficient. No migration writes a `ready=true` flag.
- Serialize ticks with a transaction advisory lock; retain all original booking row locks, the one-live-booking unique index, ownership checks and 15-minute deadlines.
- Replace user-triggered administrative bootstrap and permanently cached Edge success with read-only, fresh verification. Client readiness is also checked on every acceptance.
- Add database-scoped job/role names to avoid sharing a fixed job name between applications on one cluster.
- Provisioned `bazgo_expiry_vshyveaykgkhngwyvshy` with only the required explicit CONNECT/schema/tick grants; confirmed it cannot insert bookings. No password or role memberships were configured.
- Add idempotent administrator scripts, safe diagnostic classifications and unattended scheduler/integration assertions.

## Required permissions and setup

These steps require a **provider-authorized database administrator**. Do not grant superuser/CREATE-in-postgres access, `cron` access, role creation or a service-role key to mobile users or the app. If the workspace exposes no administration connection, ask OnSpace's database administrator to run these scripts; the app database SQL connection is insufficient.

### 1. Application database

The verification migration AND worker-role grants are already applied to this project. Skip role provisioning here unless an administrator needs to audit/reapply it. Worker authentication and the `postgres` cron job remain outstanding. On a fresh deployment, apply the migration after the existing BAZGO schema.

Connect to `vshyveaykgkhngwyvshy` as an administrator with permission to create the worker role and grant database/function privileges:

```sh
psql "$APPLICATION_ADMIN_DB_URL" -f supabase/admin/bazgo-expiry-application.sql
```

This creates login `bazgo_expiry_vshyveaykgkhngwyvshy`, without superuser, database/role creation, inherited roles, replication or RLS bypass. Its explicit grants are CONNECT, public-schema USAGE and EXECUTE on the single guarded tick; it gets no marketplace table writes or service-role membership.

Do not add memberships to this role. Review any existing role's grants before reuse.

### 2. Configure actual job execution

Because `cron.use_background_workers=off` in this backend, choose an administrator-supported configuration:

- **Preferred when supported:** enable `cron.use_background_workers=on` through the provider's cluster configuration and perform the required PostgreSQL restart. Verify worker capacity; this backend reports `max_worker_processes=32`. Background workers avoid libpq password setup.
- **If keeping libpq mode:** set a strong dedicated-worker password with `psql \\password bazgo_expiry_vshyveaykgkhngwyvshy`; configure a narrowly scoped SCRAM `pg_hba.conf` rule for that role/application database and the provider-managed socket/host; place a matching credential in the PostgreSQL OS account's `.pgpass` (mode 0600). At the observed host `/tmp`, the password file's local-socket hostname matching must be configured correctly. Never enable broad `trust` authentication, commit the password, or store it in the application/Edge Function.

The managed provider must implement filesystem/cluster configuration. An application migration cannot change these postmaster settings or supply `.pgpass` securely.

### 3. Administration database

Connect to `postgres` as the provider-authorized administrator able to install pg_cron and schedule as the dedicated worker. pg_cron ordinarily requires superuser permission to schedule for a different username; managed providers may expose an equivalent approved administration facility.

```sh
psql "$POSTGRES_ADMIN_DB_URL" -f supabase/admin/bazgo-expiry-postgres.sql
```

The script installs the extension if missing, schedules exactly:

```sql
select cron.schedule_in_database(
 'bazgo-expiry-vshyveaykgkhngwyvshy',
 '10 seconds',
 'select public.bazgo_expiry_tick()',
 'vshyveaykgkhngwyvshy',
 'bazgo_expiry_vshyveaykgkhngwyvshy',
 true
);
```

A one-minute cadence is used only when this pg_cron version rejects seconds syntax. Permission/connectivity errors are not mistaken for version incompatibility. The legacy fixed-name job is deactivated only if it targets this same app database and same tick; no other application's jobs are touched.

### 4. Verify actual autonomous runs before allowing booking

In `postgres`:

```sql
select extname, extversion from pg_extension where extname = 'pg_cron';
select jobid, jobname, schedule, database, username, active
from cron.job where jobname in ('bazgo-expiry-vshyveaykgkhngwyvshy', 'bazgo-expire-negotiations');
select r.status, r.return_message, r.start_time, r.end_time
from cron.job_run_details r join cron.job j using (jobid)
where j.jobname = 'bazgo-expiry-vshyveaykgkhngwyvshy'
order by r.start_time desc limit 10;
```

Require at least two successful runs under the correct role/database. If cron's RLS hides a worker's job from the inspecting role, use the authorized provider administrator; an empty RLS-filtered result is not proof that no job exists.

In the application database, inspect WITHOUT calling a tick or snapshot:

```sql
select public.bazgo_scheduler_status();
select key, ready, checked_at, scheduler_details
from public.bazgo_runtime where key = 'expiry_scheduler';
```

Require `ready=true`, `verifiedTicks=2`, two advancing timestamps 5–90 seconds apart and a heartbeat under 120 seconds old. Wait another scheduling interval with all apps closed and inspect again: timestamps must advance autonomously. The read-only Edge probe then returns HTTP 200. Never manually call the tick, insert a heartbeat or change `ready` to satisfy the check.

## Verification performed in this session

**Passed using live database queries:**
- Migration executed successfully; `bazgo_scheduler_status()` returns `ready=false`, `reason=missing_heartbeat` as expected.
- Missing scheduler reservation attempt is rejected before any reservation is written (used a nonexistent load).
- Non-worker tick is rejected with insufficient privilege before expiry or heartbeat writes.
- Anonymous users cannot reserve; authenticated users cannot call tick, status or unlocked reservation helper directly.
- Edge service role can inspect status but cannot execute the tick.
- Dedicated worker role was provisioned successfully; it can execute the tick but cannot insert marketplace bookings.
- Existing exclusive-booking unique index and load/expiry row locks remain present; zero duplicate live bookings observed.

**Not passed/not executed:** administrator job activation, inspection of `postgres` job-run logs, autonomous cleanup of a real overdue reservation, authenticated accepting/confirming/rebooking, simultaneous driver network races, installed-device chat, and full 15-minute unattended expiry. There is no command runner or authenticated three-account test session in this editor, and production data cannot be changed for testing. Test files are provided, not reported as executed.

## Complete-flow acceptance tests after administrator setup

See `tests/BOOKING_TEST_PLAN.md` and `tests/booking.integration.test.ts`. Use a disposable project with one real merchant and two real drivers.

1. Verify recurring heartbeat changes with no snapshots or tick invocations.
2. Accept one load simultaneously from two drivers; exactly one wins, retries return the same negotiation and initial price/deadline remain unchanged.
3. Submit a proposal and confirm as merchant; save the agreed price and reject all competing drivers.
4. Cancel a temporary negotiation as either party; release the load and permit rebooking.
5. Leave a reservation untouched for the full 15 minutes plus cleanup cadence. Read raw tables **before any snapshot or booking RPC**: negotiation must be `expired`, cancellation reason `timeout`, load `available`, active ID null, and both notifications present.
6. Reject late confirmation; allow another driver to rebook.
7. Pause the job via `cron.alter_job(..., active := false)` in the disposable project; after the heartbeat becomes stale, both Edge and RPC checks must reject bookings. Reactivate and require two advancing ticks before booking resumes. Do not edit runtime flags or shorten production deadlines.

Logical expiry is exactly the server's 15-minute deadline; physical cleanup occurs on the next successful scheduled tick (normally within 10 seconds, or within one minute for the fallback). No app needs to be running. Long worker delays correctly make booking verification fail closed.

## If pg_cron is actually unavailable

This cluster has pg_cron available and preloaded, so no speculative fallback was installed. If the provider later confirms pg_cron cannot be provisioned, use its supported external scheduled-job facility with a dedicated server-to-server authenticated worker, read-only health checks, recurring authenticated heartbeats and the same transactional expiry path. It must be provisioned and independently verified before changing the source/worker check. Mobile polling, Edge background loops and manual tick calls are not reliable substitutes.
