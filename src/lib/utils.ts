import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(value: number | string | null | undefined): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (num === null || num === undefined || isNaN(num)) return 'R$ 0,00';
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(num);
}

export function formatDate(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}

export function formatDateTime(dateString: string | Date | null | undefined): string {
  if (!dateString) return '-';
  const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
  if (isNaN(date.getTime())) return '-';
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}

export function getCurrentMonthRef(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
}

export function formatMonthName(monthRef: string): string {
  if (!monthRef || !monthRef.includes('-')) return monthRef;
  const [yearStr, monthStr] = monthRef.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1;
  const date = new Date(year, month, 1);
  const monthName = new Intl.DateTimeFormat('pt-BR', { month: 'long' }).format(date);
  return `${monthName.charAt(0).toUpperCase() + monthName.slice(1)} de ${year}`;
}

export function getOffsetMonthRef(monthRef: string, offset: number): string {
  const [yearStr, monthStr] = monthRef.split('-');
  let year = parseInt(yearStr, 10);
  let month = parseInt(monthStr, 10) + offset;
  while (month > 12) {
    month -= 12;
    year += 1;
  }
  while (month < 1) {
    month += 12;
    year -= 1;
  }
  return `${year}-${String(month).padStart(2, '0')}`;
}

export function formatMonthYearBR(monthRef: string): string {
  if (!monthRef || !monthRef.includes('-')) return monthRef || '';
  const [yearStr, monthStr] = monthRef.split('-');
  return `${monthStr}/${yearStr}`;
}

export function formatDayToDateBR(day: number | string, monthRef: string): string {
  if (!day) return '-';
  const cleanDay = String(day).padStart(2, '0');
  if (!monthRef || !monthRef.includes('-')) return `${cleanDay}/--/----`;
  const [yearStr, monthStr] = monthRef.split('-');
  return `${cleanDay}/${monthStr}/${yearStr}`;
}

export function isMonthInRange(targetMonth: string, startMonth?: string | null, endMonth?: string | null): boolean {
  if (startMonth && targetMonth < startMonth) return false;
  if (endMonth && targetMonth > endMonth) return false;
  return true;
}
