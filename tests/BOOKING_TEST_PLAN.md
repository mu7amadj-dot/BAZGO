# BAZGO booking verification

## Current deployment status

The application scheduler-verification migration and least-privileged worker login are applied. **The administration-database cron job and worker authentication still need provider setup. No autonomous expiry or complete booking-flow test has been executed successfully in this editor.** Booking safety checks intentionally remain enabled and fail closed.

Exact observations, provisioning scripts, database permissions and administrator verification queries: `docs/BOOKING_SCHEDULER.md`.

## Architecture and safeguards

- Local demo data is separate and never represents a server booking.
- Secure mode requires a real authenticated merchant/driver account with immutable role.
- Accept Load verifies the read-only Edge scheduler probe, then the reservation RPC independently rechecks fresh recurring worker heartbeats.
- A dedicated database login runs `public.bazgo_expiry_tick()` through pg_cron in the app database. Two ticks 5–90 seconds apart and the latest under two minutes old are required.
- No migration, app, service-role API or normal database `SET ROLE` may manufacture readiness. No device timer releases a booking.
- pg_cron cadence is 10 seconds with one-minute fallback only for unsupported seconds syntax. The negotiation deadline remains exactly 15 minutes and is checked after row locking on server commands.
- Expiry atomically releases the temporary reservation, clears the active negotiation pointer and notifies both participants. Confirmed bookings are not expired.
- Load-first row locking and the partial unique index prevent duplicate live bookings. Snapshot polling is three seconds; it is not an autonomous scheduler.
- Voice attachments remain participant-private, at most 60 seconds/5 MB. Ratings remain optional, one per participant after delivery, 1–5 stars, optional comment and no rewards.

## Live checks passed during this session

- Application scheduler migration executed successfully.
- `bazgo_scheduler_status()` returns `ready=false`, `missing_heartbeat`, zero verified ticks when no job has run.
- Missing scheduler blocks a reservation attempt on a nonexistent load without creating user data.
- A non-worker database session cannot run the heartbeat tick.
- Anonymous users cannot reserve; authenticated users cannot call expiry tick, status, or unlocked reservation helper.
- Edge service role can inspect status, not execute tick; worker can execute tick, not insert bookings.
- Existing booking unique index, row locks, RLS and exact 15-minute interval remain in place. No duplicate live bookings found.

## Not verified

The SQL editor connects only to the application database, not `postgres`. No command runner or authenticated three-user/device session is available. pg_cron administration job existence/run logs, worker authentication, recurring real ticks, successful acceptance, genuine network concurrency, cancellation/confirmation races and full unattended cleanup remain pending. Test files are provided, **not reported as executed**.

## Automated tests

Use a disposable OnSpace Cloud test project with three dedicated, verified real accounts. Apply the existing marketplace schema, the scheduler-verification migration and provider administration setup before enabled-scheduler tests. Never modify production reservations for testing. Tests create labeled loads through normal authenticated APIs and do not shorten server deadlines or delete fixtures; manage cleanup through Cloud → Data.

Set local variables, never commit passwords or keys:

- `TEST_BACKEND_URL`, `TEST_ANON_KEY`
- `TEST_MERCHANT_EMAIL`, `TEST_MERCHANT_PASSWORD`
- `TEST_DRIVER_A_EMAIL`, `TEST_DRIVER_A_PASSWORD`
- `TEST_DRIVER_B_EMAIL`, `TEST_DRIVER_B_PASSWORD`

Run normal booking and unattended heartbeat tests:

```sh
deno test --allow-env --allow-net tests/booking.integration.test.ts
```

Run the actual 15-minute no-polling expiry test (approximately 17 minutes):

```sh
TEST_FULL_EXPIRY=true deno test --allow-env --allow-net tests/booking.integration.test.ts
```

Run fail-closed checks while a disposable project's scheduler is missing/stale:

```sh
TEST_EXPECT_SCHEDULER_BLOCKED=true deno test --allow-env --allow-net tests/booking.integration.test.ts
```

Without credentials the tests are skipped; a skipped suite is NOT a passed verification. Set the blocked-scheduler flag only when missing/stale readiness is deliberately expected.

Coverage:

1. Read-only probe checks two valid ticks; after 75 seconds of no snapshots/tick calls, heartbeat must advance.
2. Simultaneous acceptance by two real drivers: exactly one wins; winner's retry reuses the same negotiation and 15-minute deadline.
3. Reject unauthorized cancellation/chat/confirmation, confirmation before proposal, changed proposals and pre-delivery ratings.
4. Early cancellation releases load; previously losing driver can rebook.
5. Merchant final confirmation stores the agreed price, confirms booking and excludes competing drivers.
6. Concurrent confirmation/cancellation yields exactly one terminal transition.
7. Text retry deduplication, forged voice-path rejection, transport/delivery permissions and optional 1–5-star ratings.
8. Full unattended expiry: inspect raw load/negotiation/notification tables BEFORE any snapshot; prove load availability, null reservation pointer, timeout reason, ended timestamp and notifications for both parties; reject late confirmation and permit rebooking.
9. Missing/stale scheduler rejected both by Edge and by the reservation RPC without creating a fixture.

## Administrator outage test

Only in a disposable project, deactivate its job with `cron.alter_job(jobid, active := false)`. Wait until the heartbeat is at least two minutes old. Confirm both readiness probe and reservation RPC refuse booking; existing reservations stay subject to deadline checks. Reactivate the job, require two successful autonomous runs and repeat acceptance. Never edit `bazgo_runtime.ready` or manually call a tick to simulate recovery.

## Device checklist after all server tests pass

- Publish a load as merchant; drivers see Available and initial IQD price.
- Accept simultaneously on two devices; winning driver automatically opens direct chat; losing driver sees a clear rejection.
- Restart the winning device; same deadline/chat restored, timer never restarts.
- Send actual microphone audio/text from both parties; test permissions, interrupted upload and private playback on installed iOS/Android builds.
- Driver proposes price; merchant confirms final agreement; both see identical saved price/status.
- Cancel before confirmation as each role in separate tests, then rebook.
- Close all apps for the real deadline plus job cadence; inspect raw rows before reopening.
- Driver starts transport, merchant confirms delivery; each can rate or skip without rewards.
- Check poor connectivity, background/resume, rotation, keyboard handling and duplicate network retries.
