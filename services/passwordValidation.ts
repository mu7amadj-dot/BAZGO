// Passwords are transient input only: never added to profiles, storage or logs.
export const minimumPasswordLength = 6;
export const maximumPasswordBytes = 72;
export function passwordByteLength(value: string): number {
  return Array.from(value).reduce((total, character) => {
    const point = character.codePointAt(0) ?? 0;
    return total + (point <= 0x7f ? 1 : point <= 0x7ff ? 2 : point <= 0xffff ? 3 : 4);
  }, 0);
}
export function validatePassword(value: string): string {
  if (value.length < minimumPasswordLength || !value.trim()) throw new Error('الرقم السري يجب أن يحتوي على 6 أحرف أو أرقام على الأقل.');
  if (passwordByteLength(value) > maximumPasswordBytes) throw new Error('الرقم السري طويل جداً. استخدم حتى 72 حرفاً إنجليزياً أو رقماً، أو نصاً عربياً أقصر.');
  return value; // Never trim or normalize a password.
}
export function validatePasswordConfirmation(password: string, confirmation: string): void {
  validatePassword(password);
  if (password !== confirmation) throw new Error('تأكيد الرقم السري غير مطابق.');
}
