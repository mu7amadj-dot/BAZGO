# Role-first real registration — device test plan

These are required verification scenarios, not executed results. Use consenting Iraqi recipients and a production OTPIQ key. This editor did not send SMS or create test user accounts.

## New merchant
1. Log out and open `/login`. “إنشاء حساب” is selected and merchant/driver cards appear before personal fields.
2. Select merchant. Confirm full name, phone, company/factory, city/area and province dropdown appear; driver fields do not.
3. Leave a required field blank and submit. Show a validation error without sending SMS.
4. Complete the form and request OTP. Verify real handset delivery separately from provider task acceptance.
5. Enter an incorrect or expired code: no marketplace activation or profile upload occurs.
6. Enter the real six-digit code. Confirm the selected role and entered details remain intact.
7. Review and save. Verify the real account appears in the merchant home and profile, then survives logout and another OTP login.

## New driver
1. Select driver. Confirm name, phone, father/grandfather, province, vehicle, maximum capacity and all three photo attachments appear.
2. Select each photo using gallery and camera. Verify preview behavior at 320px width and in landscape.
3. Invalid vehicle/capacity and missing names must block the initial SMS request.
4. Complete OTP. Confirm text, dropdown values and photo previews are retained.
5. Save. Verify attachments upload only now to the user's private profile folder and the real driver profile is restored after login.
6. Simulate an upload failure. Display the error and retain the draft for retry; never report activation from local state alone.

## Existing accounts and recovery
- “لديّ حساب” exposes phone login without asking existing users to re-enter their profile. Correct OTP restores the saved role and data.
- A previously registered phone entered through the new-account form restores its existing account; it must not change role or create a duplicate marketplace account.
- After selecting a role and entering details, go to OTP, then choose “تعديل البيانات أو رقم الهاتف”: the draft and image selections remain.
- Resend is unavailable for at least 60 seconds. Resending preserves details, invalidates the previous code and retains server rate limits.
- Arabic/Persian digits and leading-zero codes remain supported; iOS one-time-code and Android SMS autocomplete remain configured.
- An authenticated session without a server-verified number cannot save a new marketplace profile. Signing out allows the real phone OTP flow; no silent linkage to a legacy email account occurs.
- Offline synchronization exposes retry/logout controls and retains the current draft. Saved accounts must never be overwritten based on a failed snapshot read.
- Logout and switching between authenticated users clear registration details and image URIs.
- Restarting before save does not persist the unsaved draft. Restarting after save restores the server account through the existing session and context providers.

## Safety and boundaries
- Confirm no local fixed code or demo account exists in the login flow.
- Run `deno test --allow-read tests/registrationUi.test.ts tests/phoneAuthBoundary.test.ts` for static source checks. These do not replace device/integration tests.
- Verify account role immutability, verified-phone protection and private image access with two separate users.
- Inspect client requests/bundles: no provider/admin credentials; phone/code requests go only through the existing phone-auth function.
- Booking scheduler, reservation locks and chat/rating permissions must remain unchanged.
