import { ApiError } from './errors.ts';

export async function readJsonObject(request: Request): Promise<Record<string, unknown>> {
  let parsed: unknown;
  try {
    parsed = await request.json();
  } catch {
    throw new ApiError(400, 'Body request bukan JSON yang valid.');
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    throw new ApiError(400, 'Body request harus berupa JSON object.');
  }
  return parsed as Record<string, unknown>;
}

export function asObject(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    throw new ApiError(400, `${field} harus berupa JSON object.`);
  }
  return value as Record<string, unknown>;
}

export function pathId(request: Request): string {
  let pathname: string;
  try {
    pathname = new URL(request.url).pathname;
  } catch {
    throw new ApiError(400, 'URL request tidak valid.');
  }
  const segments = pathname.split('/').filter(Boolean);
  const raw = segments[segments.length - 1];
  if (!raw) throw new ApiError(400, 'ID tidak ditemukan pada URL.');
  let decoded: string;
  try {
    decoded = decodeURIComponent(raw);
  } catch {
    throw new ApiError(400, 'ID pada URL tidak valid.');
  }
  return requireText(decoded, 'id', 100);
}

export function requireText(value: unknown, field: string, max = 300): string {
  if (typeof value !== 'string') throw new ApiError(400, `${field} harus berupa teks.`);
  const trimmed = value.trim();
  if (!trimmed) throw new ApiError(400, `${field} wajib diisi.`);
  if (trimmed.length > max) throw new ApiError(400, `${field} terlalu panjang (maksimal ${max} karakter).`);
  return trimmed;
}

export function optionalText(value: unknown, field: string, max = 300): string | null {
  if (value === undefined || value === null || value === '') return null;
  return requireText(value, field, max);
}

export function requireInt(value: unknown, field: string, min: number, minMessage?: string): number {
  if (typeof value !== 'number' || !Number.isInteger(value) || !Number.isSafeInteger(value)) {
    throw new ApiError(400, `${field} harus berupa bilangan bulat.`);
  }
  if (value < min) {
    throw new ApiError(400, minMessage ?? `${field} tidak boleh kurang dari ${min}.`);
  }
  return value;
}

export function requireDate(value: unknown, field: string): string {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ApiError(400, `${field} harus berformat YYYY-MM-DD.`);
  }
  const parsed = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) {
    throw new ApiError(400, `${field} bukan tanggal yang valid.`);
  }
  return value;
}

export function requireTimestamp(value: unknown, field: string): Date {
  if (typeof value !== 'string' || !value.trim()) {
    throw new ApiError(400, `${field} harus berupa tanggal.`);
  }
  const timestamp = Date.parse(value);
  if (Number.isNaN(timestamp)) throw new ApiError(400, `${field} bukan tanggal yang valid.`);
  return new Date(timestamp);
}

export function generateId(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}
