// Powered by OnSpace.AI
// Formatting helpers for BAZGO (Arabic / IQD)

export function formatIQD(amount: number): string {
  const n = Math.round(amount).toLocaleString('en-US');
  return `${n} د.ع`;
}

export function formatWeight(tons: number): string {
  return `${tons} طن`;
}

export function formatDistance(km: number): string {
  return Number.isFinite(km) && km > 0 ? `${km} كم` : 'غير محددة';
}

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];

export function formatDate(input: string | number): string {
  const d = new Date(input);
  if (isNaN(d.getTime())) return String(input);
  return `${d.getDate()} ${AR_MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'الآن';
  if (mins < 60) return `قبل ${mins} دقيقة`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `قبل ${hrs} ساعة`;
  const days = Math.floor(hrs / 24);
  return `قبل ${days} يوم`;
}

export function formatTime(ts: number): string {
  const d = new Date(ts);
  const h = d.getHours();
  const m = d.getMinutes().toString().padStart(2, '0');
  const period = h >= 12 ? 'م' : 'ص';
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${period}`;
}
