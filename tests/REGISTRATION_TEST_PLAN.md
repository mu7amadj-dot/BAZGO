# Real merchant/driver registration and password login — device test plan

These are required scenarios, not executed results. Use consenting Iraqi recipients, a Production OTPIQ key and real iOS/Android devices. This editor sent no SMS and created/modified no real users.

## New merchant and driver
1. Open `/login`, select “إنشاء حساب” and then merchant or driver before personal details appear.
2. Merchant: verify name, phone, company/factory, city/area and province. Driver: verify name, phone, father/grandfather, province, vehicle, capacity and all three optional photos.
3. Choose a password and matching confirmation. Fewer than six characters, blank input, mismatched confirmation or more than 72 UTF-8 bytes must prevent SMS requests. Arabic passwords are supported without normalization; leading-zero passwords stay unchanged.
4. Complete role details, request OTP and confirm actual handset receipt separately from OTPIQ task acceptance.
5. Incorrect, expired, replaced or replayed OTP must not set/reset passwords, activate the marketplace or upload photos.
6. Submit the real code. Password is saved by Auth; role details/photo selections remain intact. Password input clears after authentication.
7. Review and save the marketplace account. Confirm private photos upload only now. Failed uploads retain the draft and show an error.
8. Log out, choose “لديّ حساب”, enter the same phone/password. Verify direct login with **zero** SMS/provider requests and no OTP screen. Restore the same user ID, role, account details, loads and chat history.

## Existing accounts without passwords
1. Choose “لديّ حساب”. A generic failure must not silently send OTP or grant phone-only access.
2. Choose “تعيين أو استعادة الرقم السري”, enter the registered phone and a matching new password/confirmation, request SMS and verify it once.
3. Confirm the same account/user ID and all saved marketplace records are retained; no duplicate account or role change.
4. Log out and sign in with phone/password without OTP. Repeat after restarting the app.
5. Existing authenticated sessions are not forcibly logged out by this release. Password setup is needed before the next password login, not silently assigned during startup.

## Password recovery and duplicate registration
- Incorrect password: generic error, no session and no SMS; the form stays responsive.
- Password reset: enter a new matching password, consume a correct OTP and restore the existing account. The old password must fail and the new one must work without SMS.
- Recovery for an unknown number: after OTP ownership proof, show `account_not_found`; create no identity or marketplace account.
- Registration using a number that already has a password: after OTP verification, show `account_exists` and return to password login; do not overwrite the existing password. Use explicit recovery to change it.
- Five invalid password attempts per phone/ten minutes and two-second spacing: show the server retry time and disable retries until it passes. Verify IP/global limits independently. A reload cannot bypass server limits.
- If password was saved but session exchange fails, ordinary login with that chosen password should work. Do not report a local activation or permit OTP replay.

## Draft, inputs and platform behavior
- Password-manager current/new-password autocomplete, masked text and show/hide work on iOS/Android at 320px width and landscape.
- Changing between registration/login/recovery clears password/confirmation, not persisted account data.
- Correcting details/phone before OTP retains role details and photo selections. Resends retain the draft, invalidate old codes and wait at least 60 seconds.
- Arabic/Persian phone/OTP digits normalize as before; passwords are never normalized or trimmed.
- Logout/user replacement clears password and registration state. Closing the app before save does not persist a plaintext password or unsaved registration draft.
- Failed snapshot reads show retry/logout instead of overriding an existing account. Anonymous-to-authenticated registration does not discard role details.

## Security and regression checks
- Run `deno test tests/phonePassword.test.ts tests/phoneAuthConfig.test.ts` for pure/mocked checks.
- Run `deno test --allow-read tests/passwordAuthUi.test.ts tests/registrationUi.test.ts tests/phoneAuthBoundary.test.ts` for static contracts. These do not simulate rendering or replace device tests.
- Inspect authorized test bundles/requests: no provider/admin keys; passwords only in HTTPS auth requests, never logs, profiles, notifications or persistent app storage.
- Password login must work when the OTP provider is unavailable in an isolated test backend. Registration/recovery should show appropriate SMS errors without bypassing verification.
- Verify `bazgo_password_enabled` is protected server app metadata. Client profile changes cannot set/reset passwords or enable password login.
- Cross-user identity/private-document reads and verified-phone changes remain denied. Password replies must not reveal internal emails or another user's session.
- Root AuthRouter, provider session restoration, account/role guards, booking scheduler checks, reservation locks, voice chat and rating permissions remain unchanged.
