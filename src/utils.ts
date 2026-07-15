export function formatRupiah(value: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(value);
}

export function formatDateIndo(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return dateStr;
  
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  
  const day = date.getDate();
  const month = months[date.getMonth()];
  const year = date.getFullYear();
  
  return `${day} ${month} ${year}`;
}

export function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate();
}

/**
 * Filter transactions by date range
 */
export function isToday(dateStr: string, currentSystemDate: string = '2026-07-14'): boolean {
  return dateStr === currentSystemDate;
}

export function isThisWeek(dateStr: string, currentSystemDateStr: string = '2026-07-14'): boolean {
  const date = new Date(dateStr);
  const current = new Date(currentSystemDateStr);
  
  // Calculate start of current week (e.g. Sunday or Monday)
  const currentDay = current.getDay();
  const diff = current.getDate() - currentDay + (currentDay === 0 ? -6 : 1); // Adjust for Monday start
  const startOfWeek = new Date(current.setDate(diff));
  startOfWeek.setHours(0, 0, 0, 0);
  
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6);
  endOfWeek.setHours(23, 59, 59, 999);
  
  const targetTime = date.getTime();
  return targetTime >= startOfWeek.getTime() && targetTime <= endOfWeek.getTime();
}

export function isThisMonth(dateStr: string, currentSystemDate: string = '2026-07-14'): boolean {
  const date = new Date(dateStr);
  const current = new Date(currentSystemDate);
  return date.getFullYear() === current.getFullYear() && date.getMonth() === current.getMonth();
}

export function isThisYear(dateStr: string, currentSystemDate: string = '2026-07-14'): boolean {
  const date = new Date(dateStr);
  const current = new Date(currentSystemDate);
  return date.getFullYear() === current.getFullYear();
}
