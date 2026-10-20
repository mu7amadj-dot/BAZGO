# BAZGO booking verification

## Implementation boundaries
- Existing local demo screens/data remain separate. They do not represent server bookings.
- Secure mode uses real email/password sessions. Registration uses the configured four-digit email OTP; local six-digit phone OTP remains explicitly demo-only.
- Account roles are fixed server-side. Booking is disabled unless autonomous server expiry scheduling is verified.
- pg_cron runs `public.bazgo_expiry_tick()` in this application's database every 10 seconds (one-minute fallback on older pg_cron). The server deadline is exactly 15 minutes: every command checks it after acquiring the load lock. A server snapshot projects an overdue reservation as expired even if physical cleanup is briefly delayed.
- Expiry does not depend on an open app. Database changes/notifications are normally delivered to open screens via three-second polling; no unsupported Realtime or background push is claimed.
- Private voice messages are limited to 60 seconds / 5 MB, use private Storage and five-minute signed playback URLs. Native recording requires a fresh build after adding microphone permission.
- Ratings are optional, one per participant per delivered trip, 1–5 stars with an optional comment, and no points/bonuses.

## Checks performed during implementation
- Database schema and RPC creation completed successfully.
- All seven marketplace tables have RLS enabled.
- Anonymous reservation calls are denied by function grants.
- Authenticated clients cannot insert bookings directly or call expiry helpers.
- The partial unique index permits only one active negotiation/booking for each load.
- Snapshot query contract executed successfully with an isolated read-only identity.
- Existing database inspection found zero duplicate live bookings.

## Not yet verified in this editor
There is no command runner or authenticated multi-device session in this editor. The integration tests below were added but have not been executed. The scheduler Edge Function is deployed when the session's code changes take effect; its bootstrap and an actual cron run must be verified. Do not consider the concurrency, full 15-minute expiry, voice permission/playback, or installed-device tests passed until they are run.

## Automated integration tests
Use a disposable OnSpace Cloud project and three dedicated, verified real accounts: one merchant and two drivers. Tests create labeled test loads through normal authenticated APIs; they never shorten the production timer or bypass booking locks. They do not delete fixtures. Manage cleanup in Cloud → Data.

Set these local environment variables (never commit credentials):
- TEST_BACKEND_URL
- TEST_ANON_KEY
- TEST_MERCHANT_EMAIL / TEST_MERCHANT_PASSWORD
- TEST_DRIVER_A_EMAIL / TEST_DRIVER_A_PASSWORD
- TEST_DRIVER_B_EMAIL / TEST_DRIVER_B_PASSWORD

Run:
```sh
deno test --allow-env --allow-net tests/booking.integration.test.ts
```
Enable the genuine autonomous-expiry test (about 17 minutes):
```sh
TEST_FULL_EXPIRY=true deno test --allow-env --allow-net tests/booking.integration.test.ts
```
Scenarios: simultaneous drivers, same-driver retry, unauthorized confirmation/cancellation/chat, early cancellation, rebooking, stale price proposal, confirmed-booking exclusion, text retry deduplication, forged audio attachment, transport/delivery permissions, 1/5-star ratings, invalid/duplicate ratings, concurrent confirmation vs cancellation, unattended expiry, late confirmation rejection.

## Scheduler administration fallback
The `bazgo-scheduler` Edge Function reads only preconfigured server secrets. It installs pg_cron in the `postgres` administration database, registers one fixed job in the application database, and waits for a real cron heartbeat before allowing reservations. It never fabricates readiness. If the workspace database role cannot access `postgres`, an administrator must run:
```sql
-- Run in the postgres administration database, with the application's privileged database role.
create extension if not exists pg_cron;
select cron.schedule_in_database(
  'bazgo-expire-negotiations',
  '10 seconds',
  'select public.bazgo_expiry_tick()',
  'vshyveaykgkhngwyvshy'
);
```
Use `* * * * *` instead of `10 seconds` for an older cron version. Verify `cron.job.active`, then inspect `cron.job_run_details` and `public.bazgo_runtime.checked_at` in the application database. A stale/missing readiness heartbeat fails closed: drivers cannot reserve loads.

## Device/manual checklist
1. Merchant publishes a load; both driver devices see Available and its initial IQD price.
2. Tap Accept Load simultaneously. Only one driver gets a reservation and auto-opened direct chat; the other sees a clear server rejection.
3. Reload/restart the winning driver's app: the same chat/deadline is restored; remaining time does not restart.
4. Send text and actual microphone audio from both devices. Grant/deny microphone permission; retry an interrupted upload; ensure other accounts cannot read the private media.
5. Agree on a price. Driver submits it; merchant clicks Confirm Final Agreement. Both see the same saved final price and Confirmed status.
6. Cancel before confirmation from either party. Both see cancellation notifications; the load becomes Available, and another driver can reserve it.
7. Leave both apps closed for 15 minutes. Inspect the raw load table after the cron cleanup interval, before calling a snapshot: it must be Available. Late confirmation must fail.
8. Repeat cancellation vs confirmation at the same moment and verify exactly one outcome. Retry confirm after a network interruption and inspect that there is still one booking.
9. Driver starts transport; merchant confirms receipt. Both can optionally rate each other, or leave without rating. Invalid/duplicate ratings fail; no reward points appear.
10. Run on installed iOS/Android builds and web over HTTPS. Check poor connectivity, background/resume, rotation, and keyboard layouts.
