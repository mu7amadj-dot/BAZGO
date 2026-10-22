# BAZGO — Real phone OTP authentication

## Architecture
- One login/registration screen: Iraqi mobile number → Twilio Verify SMS → server verification → ordinary OnSpace Cloud user session → existing AuthProvider → account role and details.
- `services/phoneAuthService.ts` calls `bazgo-phone-auth` with phone/code only. It never contains or requests Twilio credentials, never calls Twilio directly, and never creates a second frontend Supabase client.
- The Edge Function reads `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_VERIFY_SERVICE_SID`, and the preconfigured backend secrets from `Deno.env` only. Never use an `EXPO_PUBLIC_` variable for any of them.
- Sending SMS is public before login. `verify_jwt=false` is intentional; the function independently validates inputs, throttles calls and requires a successful Twilio `approved` verification before issuing a session.
- Twilio handles code generation, expiration, attempt tracking and replay prevention. There are no local accepted codes or mocked login paths. The UI uses the service's `code_length` (typically six digits), a 60-second resend wait and the standard Verify ten-minute expiry.
- OnSpace's existing email-capable AuthProvider is preserved. A random, non-deliverable internal Auth address under `phone.bazgo.invalid` bridges a verified phone identity to an ordinary Auth session. It is never a user-entered email, never used to send an email, and never represents an email ownership check.
- Internal addresses and generated magic-link hashes stay server-side. The response contains only the authenticated user's access/refresh tokens. `setSession` on the existing client lets its AuthProvider listener handle session state and persistence.
- Database provisioning uses a per-phone lease and unique phone/user constraints. The stable, server-only bootstrap address allows recovery if provisioning stops between Auth creation and identity storage. Incorrect/expired codes do not create accounts.
- `bazgo_phone_identities` references `user_profiles`. RLS and privileges deny all direct anonymous/authenticated access to identity, bootstrap and rate-limit tables; service role alone operates them. `bazgo_verified_phone` exposes only the requesting user's number.
- A database trigger rejects any profile write that differs from that user's verified number. Phone-account edit screens display it read-only. A separate OTP-based number-change flow is not yet implemented.

## Deployment and configuration
1. The phone migration `20261022110000_bazgo_phone_otp.sql` has been applied to this project; keep it for other environments.
2. Deploy `supabase/functions/bazgo-phone-auth/index.ts` with the shared CORS/validation files and the function entry in `supabase/config.toml`. OnSpace deploys project Edge Functions from this directory.
3. Keep the three Twilio keys exclusively in Cloud → Secrets / Edge Function environment. These keys were submitted through the secure UI; their values were not read into source files.
4. In Twilio Console → Verify → Services, check the configured service, SMS channel, code length, and Geo Permissions for Iraq. Trial accounts can send only to permitted/verified recipients; upgrade when required. Keep Twilio Fraud Guard and account spending controls enabled.
5. The gateway must overwrite `cf-connecting-ip`, `x-real-ip` or `x-forwarded-for` with the trusted caller IP. Unknown addresses share one conservative bucket. Phone/global throttling applies independently of IP headers. Add gateway-level bot/challenge protection before public high-volume launch.
6. Limits: five sends/phone/hour, at least 60 seconds between sends; ten checks/phone/ten minutes, at least two seconds between checks; thirty sends and one hundred checks/IP/hour; global caps of 500 sends and 2000 checks/hour. These are server-side bounds, not promises of SMS delivery. Failed requests count toward limits.
7. Responses use `Cache-Control: no-store`. Logs contain random request IDs and sanitized stage/provider error codes, never phone numbers, OTPs, full provider responses, tokens or keys. Do not log request bodies/session responses in external monitoring.

## Existing accounts and limitations
Existing email accounts and marketplace data are untouched. Their active sessions continue to work. Unverified contact numbers on old email accounts are **not** silently merged with phone accounts: doing so could give someone another user's account. A signed-in, explicit account-linking flow is required to migrate them safely. Once signed out, the current login screen uses phone OTP only.
SMS delivery to an Iraqi handset has not been verified in this editor session. Account credit, geographic permissions, trial restrictions and local carrier delivery still require real-device testing.
Booking scheduler checks remain unchanged and fail closed. Phone authentication does not enable or bypass booking readiness.
Rate-limit/bootstrap records are server operational metadata and require an administrative retention policy for long-term scale; no existing data was deleted.

## Tests
Pure validation: `deno test tests/phoneOtp.test.ts`.
Read-only/invalid-input integration checks: set `TEST_BACKEND_URL`, `TEST_ANON_KEY`, then `deno test --allow-env --allow-net tests/phoneAuth.integration.test.ts`.
These test files are supplied, not executed in this editor (no command runner is available).

Before publishing, test with consenting real phones:
- New merchant and driver registration, including Arabic-digit phone input and SMS autofill.
- Existing phone account login after logout, restart and session restoration; account ID must stay the same.
- Wrong OTP, expired OTP, replayed OTP, simultaneous verification, resend restrictions and repeated rapid requests.
- Offline errors, invalid configuration, trial-recipient restriction, insufficient credit and Iraq geographic restrictions.
- Profile number change through both the UI and direct account-update RPC must be rejected for phone identities.
- Anonymous and another authenticated user must not read the identity directory or another user's verified phone.
- Inspect mobile bundles and network responses to confirm that no Twilio or service-role secret is present. Ordinary user-session tokens are expected only on successful verified login.
