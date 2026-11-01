# BAZGO — phone/password login and OTPIQ verification

## Current user flows — 1 November 2026
- One `/login` screen retains merchant/driver registration and every existing role-specific field/photo.
- New registration: select a role → enter details, password and confirmation → real OTPIQ SMS → verify the six-digit code → set the Auth password on the server → review and save the marketplace account. Phone verification is required at registration, not on subsequent logins.
- “لديّ حساب”: phone + password → ordinary backend password authentication → restore the same saved user ID, role and marketplace records. No SMS, OTP challenge, account creation or magic-link exchange runs in the password-login branch.
- “تعيين أو استعادة الرقم السري”: phone + new password/confirmation → SMS → consume a valid OTP → set/reset the password for the existing verified phone identity → restore the account. A missing identity cannot be created by recovery.
- Legacy accounts have no chosen password. A read-only aggregate readiness check found zero `bazgo_password_enabled` accounts before this change. They must use the one-time setup/recovery flow once; no default passwords or insecure phone-only login were introduced. Existing authenticated sessions remain valid and no users were modified by SQL.
- Registering a number with an already-enabled password cannot overwrite that password. Only after proving phone ownership does the server return `account_exists`; the screen switches to ordinary password login. Explicit password recovery is the only reset flow.

## Credential and session boundaries
- The frontend uses the existing unique client and `functions.invoke('bazgo-phone-auth')`. Passwords travel over HTTPS to this Edge Function, then to the backend's normal Auth password API. No direct OTPIQ request or admin credential appears in client modules.
- Passwords are held only in transient input state. They are never added to `RegistrationForm`, marketplace profiles, local persistent storage, logs, OTP tables or notifications. State clears on mode changes, successful sign-in, logout and authenticated-user replacement. Do not capture sensitive request bodies in monitoring.
- Password minimum follows the current backend setting: six characters. Both client and server enforce at most 72 UTF-8 bytes, avoiding password-hash truncation. Confirmation must match exactly; passwords are not trimmed or digit-normalized. Masked fields support show/hide and password-manager autocomplete.
- Password hashing/storage is managed by the existing Auth service. This app does not implement custom hashing or store password hashes in public tables.
- The Edge Function resolves phone → private verified identity → internal Auth email and verifies the submitted password with `signInWithPassword`. It checks verified phone equality, password-enabled server app metadata, and returned user ID before issuing a session. Unknown phones, legacy accounts and incorrect passwords share the same public `invalid_credentials` response.
- The `bazgo_password_enabled` marker is written to protected Auth app metadata only after valid consumed OTP; it cannot be enabled through a client profile edit.
- Password login does not require or even read `OTPIQ_API_KEY`. SMS outages or missing provider configuration do not block accounts with passwords. Built-in backend credentials are still required, only server-side.
- OTP-verified registration/recovery retains the existing internal, non-deliverable email bridge and server magic-link session exchange. Internal emails, link hashes and administrative credentials remain on the server. Both login paths return only the requesting user's ordinary access/refresh tokens.
- The existing client's `setSession` and AuthProvider `onAuthStateChange` handle persistence. Providers, root AuthRouter, account guards, role immutability, private uploads, booking scheduler and negotiation permissions remain unchanged.

## OTP lifecycle and safety
1. Validate an Iraqi mobile, validate the new password/intent on verification, enforce shared phone/IP/global limits and acquire the per-phone provisioning lease.
2. Generate a six-digit code using unbiased Web Crypto randomness. Store a HMAC-SHA-256 digest bound to the phone hash and challenge UUID, keyed by the existing server service-role secret. Never store raw OTP.
3. Replace the previous challenge in `pending` state before sending. Only an accepted OTPIQ task activates it. Failed or uncertain tasks remain unusable; no automatic paid-send retries.
4. Expire after five minutes using database time. Five incorrect checks lock the challenge. A row-locked RPC atomically consumes the correct code once; replay and stale resend completions cannot approve it.
5. Only after consumption may registration provision an identity or recovery change its password. Recheck the verified Auth phone before password updates. A password/session failure does not reactivate a consumed code.
6. If password update succeeded but session exchange failed, sign in with the chosen password; use explicit recovery if necessary. Do not repeatedly try registration to reset an existing password.
7. Server service-role rotation invalidates active OTP digests; request new codes after rotation.

OTPIQ uses `https://api.otpiq.com/api/sms` only, with Bearer credentials, redirects rejected, `phoneNumber` without `+`, `smsType: verification`, the server-generated `verificationCode`, and `provider: sms`. No silent WhatsApp fallback. Provider task acceptance does not prove handset delivery.

## Database permissions and limits
- `bazgo_phone_identities` references `user_profiles`, with unique phone/user constraints. Random bootstrap addresses and verified phone protections are preserved. No unverified contact number or legacy email account is silently linked.
- Identity, challenge, lease and rate-limit tables remain RLS-protected and inaccessible to anonymous/authenticated direct reads and writes. OTP RPCs remain service-only. `bazgo_verified_phone` exposes only the authenticated caller's verified phone.
- No schema migration or manual password assignment is necessary for this change. Runtime password changes use the Auth admin API only after real ownership verification, never SQL updates to user records.
- Sends: five/phone/hour, minimum 60-second interval; thirty/IP/hour; global 500/hour.
- OTP checks: ten/phone/ten minutes, minimum two-second interval; one hundred/IP/hour; global 2000/hour; additional five-wrong-attempt challenge lock.
- Password attempts: five/phone/ten minutes, minimum two-second interval; thirty/IP/hour; global 500/hour. Failed attempts count. The UI displays returned retry time and never automatically substitutes OTP login after incorrect credentials.
- Gateway must overwrite forwarded IP headers with trusted caller IPs; unknown callers share a conservative bucket. Add gateway bot protection before high-volume launch. Operational retention needs administrative planning; this change deletes no records.

## Deployment and configuration
1. Retain both phone/OTP migrations: `20261022110000_bazgo_phone_otp.sql` and `20261031100000_bazgo_otpiq_challenges.sql`.
2. Deploy `bazgo-phone-auth` with all its `_shared` modules, including new `phonePassword.ts`. Its public `verify_jwt=false` configuration is intentional; password verification or consumed OTP is enforced before session issuance.
3. Keep `OTPIQ_API_KEY` in Cloud → Secrets only; it is already configured. Built-in backend URL/admin/anon settings remain server-side. No new third-party secret is needed.
4. Use an OTPIQ Production key, active project and sufficient SMS credit for registration/recovery. Never use a Dev Key for real authentication: it reroutes every OTP to a developer number and invalidates ownership proof.
5. No automatic legacy-account migration occurs. Tell existing users to select “تعيين أو استعادة الرقم السري” once, then use “لديّ حساب” for password-only login.
6. New clients send `{action: 'password_login', phone, password}` or `{action: 'verify', phone, code, password, intent: 'register' | 'reset_password'}`. Older clients without a password/intent must be upgraded. Public `send` requests remain `{action: 'send', phone}`.
7. Responses remain `Cache-Control: no-store`; logs contain request IDs, controlled stages/statuses only, not passwords, phone numbers, OTPs, configuration or session tokens. Disable sensitive-body capture in external monitoring.

## Troubleshooting
- `invalid_credentials`: wrong phone/password or a legacy account without a password. Use the visible setup/recovery action if appropriate; no SMS is sent automatically.
- `invalid_password`: password below six characters or above 72 UTF-8 bytes. Confirmation errors are shown before any SMS request.
- `account_exists`: ownership has been verified but the account already has a password; sign in or explicitly recover it.
- `account_not_found`: after OTP approval, recovery found no verified identity. Use new registration.
- `rate_limited`: wait the returned retry time; do not bypass limits.
- `configuration_missing`, `sms_unavailable`, `insufficient_credit`, `provider_failed`, `provider_unreachable`: apply only to OTP flows; check server configuration, OTPIQ Production key, project permission and credit. Password login remains independent of OTPIQ.
- `code_expired` / `code_locked`: request a replacement after the cooldown. Wrong, consumed, pending or replaced codes cannot update passwords or create sessions.
- SMS acceptance is queue acceptance only; inspect OTPIQ delivery tracking and test with consenting Iraqi handsets.

## Verification and remaining tests
Read-only SQL confirmed identity RLS, anonymous read denial, service read access and the verified-phone guard. No account passwords were read or changed. This editor has no command runner; supplied tests have **not been executed**, and no real OTP was sent:
- `deno test tests/phonePassword.test.ts tests/phoneAuthConfig.test.ts tests/phoneOtp.test.ts tests/otpiq.test.ts tests/otpChallenge.test.ts`
- `deno test --allow-read tests/passwordAuthUi.test.ts tests/registrationUi.test.ts tests/phoneAuthBoundary.test.ts`
- Invalid requests/anonymous permissions: set server/test-only `TEST_BACKEND_URL`, `TEST_ANON_KEY`, then run `deno test --allow-env --allow-net tests/phoneAuth.integration.test.ts`.
- Existing OTP lifecycle integration fixtures and five-minute expiry tests remain opt-in on a disposable backend; follow the comments in `tests/otpChallenge.integration.test.ts`. Never place test admin credentials in client environment variables.
- Device acceptance steps are in `tests/REGISTRATION_TEST_PLAN.md`. Required cases include legacy one-time setup, new role-based registration, successful/wrong password without SMS, explicit reset, old-password rejection after reset, expired/replayed OTP, registration refusing password overwrite, rate limits, session restoration and private storage access.

## Official references
- [OTPIQ Send SMS](https://docs.otpiq.com/api-reference/messaging/post.md)
- [API key security](https://docs.otpiq.com/quickstart.md)
- [Dev Keys reroute recipients](https://docs.otpiq.com/useful-articles/how-dev-key-works.md)
