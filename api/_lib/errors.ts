export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function json(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8' },
  });
}

export function noContent(): Response {
  return new Response(null, { status: 204 });
}

export function dbErrorCode(err: unknown): string | undefined {
  let current: unknown = err;
  const visited = new Set<unknown>();

  while (current !== null && typeof current === 'object' && !visited.has(current)) {
    visited.add(current);
    const code = (current as { code?: unknown }).code;
    if (typeof code === 'string' && /^\d{5}$/.test(code)) return code;
    current = (current as { cause?: unknown }).cause;
  }

  return undefined;
}

export function respondError(err: unknown): Response {
  if (err instanceof ApiError) return json({ error: err.message }, err.status);

  const code = dbErrorCode(err);
  if (code === '23505') {
    return json({ error: 'Data dengan ID tersebut sudah tersimpan.' }, 409);
  }
  if (code === '23502') {
    return json({ error: 'Data wajib belum lengkap.' }, 400);
  }
  if (code && code.startsWith('23')) {
    return json({ error: 'Data masih digunakan oleh relasi lain dan tidak dapat diubah.' }, 409);
  }
  if (code && code.startsWith('22')) {
    return json({ error: 'Data yang dikirim tidak valid.' }, 400);
  }

  console.error('[api] unexpected error:', err instanceof Error ? err.message : String(err));
  return json({ error: 'Terjadi kesalahan pada server.' }, 500);
}
