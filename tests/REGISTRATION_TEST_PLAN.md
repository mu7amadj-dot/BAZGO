# Real merchant/driver registration and password login — device test plan

These are required scenarios, not executed results. Use consenting Iraqi recipients, a Production OTPIQ key and real iOS/Android devices. This editor sent no SMS and created/modified no real users.

## New merchant
1. Open `/login`, select “إنشاء حساب” and then merchant or driver before personal details appear.
2. Merchant: verify name, phone, company/factory, city/area and province. The merchant form remains a single details form; driver registration follows the five-step section below.
3. Choose a password and matching confirmation. Fewer than six characters, blank input, mismatched confirmation or more than 72 UTF-8 bytes must prevent SMS requests. Arabic passwords are supported without normalization; leading-zero passwords stay unchanged.
4. Complete role details, request OTP and confirm actual handset receipt separately from OTPIQ task acceptance.
5. Incorrect, expired, replaced or replayed OTP must not set/reset passwords, activate the marketplace or upload photos.
6. Submit the real code. Password is saved by Auth; role details/photo selections remain intact. Password input clears after authentication.
7. Review and save the marketplace account. Confirm private photos upload only now. Failed uploads retain the draft and show an error.
8. Log out, choose “لديّ حساب”, enter the same phone/password. Verify direct login with **zero** SMS/provider requests and no OTP screen. Restore the same user ID, role, account details, loads and chat history.

## Five-step driver registration
1. Select driver. Step 1 must show only driver, father and grandfather name inputs (plus role/progress controls); blank names or more than 120 characters prevent Next.
2. Step 2 shows phone and sends SMS when Next is tapped. No password, image upload or marketplace account is created here. Enter a real six-digit OTP; wrong, expired, locked or replayed codes cannot advance or issue a session. Resend waits at least 60 seconds and invalidates the old code.
3. Valid OTP establishes a verified Auth session and opens step 3 automatically. Names survive the auth transition. The marketplace stays blocked because no account exists yet. A registered phone cannot bypass password login through driver verification.
4. Step 3 shows vehicle type, maximum load in tons and the existing province field. Invalid/zero capacity, missing vehicle or province prevent Next.
5. Step 4 shows all three image selectors. Omit each image in turn: Next must report which required image is missing. Test camera/gallery permissions, cancellation, selection and replacement on real iOS/Android.
6. Step 5 is the first step with password/confirmation inputs. Fewer than six characters, more than 72 UTF-8 bytes or mismatched confirmation prevents final upload/save. Successful final save uploads all three private images, saves the password and creates the driver account once.
7. At every step use Back/Next: details and selected images remain, scroll resets to the top, and the verified session does not send another OTP. The verified phone is read-only even when revisiting step 2.
8. Simulate upload/network/profile-save failures. No incomplete marketplace account is created; error is visible and retry remains available. Completed uploads are reused within the current session. If the password was already saved, retry must authenticate that same password, not overwrite it or require another OTP.
9. Restart before final save: verified session and onboarding role restore, but unsaved names/images/password must be re-entered. No plaintext draft is persisted. Logout clears the transient draft.
10. Use an authorized disposable backend to check the insert guard: missing each image, a nonexistent storage path, another user's image path, unverified phone or no password must reject a new driver account. Existing merchant/driver accounts and profile edits must remain unchanged.
11. Log out and sign in using the chosen phone/password. Confirm zero SMS requests and the same saved account/role/photos.
12. At 320px width, tablet width and landscape, verify controls remain visible, the image selectors are tappable and the keyboard does not cover Next/Back.

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
- Run `deno test tests/driverRegistration.test.ts` for pure step validation.
- Run `deno test --allow-read tests/driverRegistrationUi.test.ts tests/passwordAuthUi.test.ts tests/registrationUi.test.ts tests/phoneAuthBoundary.test.ts` for static contracts. These do not simulate rendering or replace device tests.
- Inspect authorized test bundles/requests: no provider/admin keys; passwords only in HTTPS auth requests, never logs, profiles, notifications or persistent app storage.
- Password login must work when the OTP provider is unavailable in an isolated test backend. Registration/recovery should show appropriate SMS errors without bypassing verification.
- Verify `bazgo_password_enabled` is protected server app metadata. Client profile changes cannot set/reset passwords or enable password login.
- Cross-user identity/private-document reads and verified-phone changes remain denied. Password replies must not reveal internal emails or another user's session.
- Root AuthRouter, provider session restoration, account/role guards, booking scheduler checks, reservation locks, voice chat and rating permissions remain unchanged.
