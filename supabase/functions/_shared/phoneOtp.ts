// Shared server-side validation. No provider credentials or session tokens are logged.
export function normalizeIraqiPhone(value: unknown): string {
  if (typeof value !== 'string' || value.length > 40) throw new Error('invalid_phone');
  const digits = value.replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) >= 0x06f0 ? digit.charCodeAt(0) - 0x06f0 : digit.charCodeAt(0) - 0x0660));
  let phone = digits.trim().replace(/[\s()-]/g, '');
  if (/^07\d{9}$/.test(phone)) phone = `+964${phone.slice(1)}`;
  else if (/^9647\d{9}$/.test(phone)) phone = `+${phone}`;
  else if (/^009647\d{9}$/.test(phone)) phone = `+${phone.slice(2)}`;
  if (!/^\+9647\d{9}$/.test(phone)) throw new Error('invalid_phone');
  return phone;
}
export function validateOtp(value: unknown): string {
  if (typeof value !== 'string' || !/^\d{6}$/.test(value)) throw new Error('invalid_code');
  return value;
}
export async function sha256(value: string): Promise<string> {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, '0')).join('');
}
