import { env } from '@/lib/validation/env';

/**
 * Resuelve URLs de archivos del API (storage local hoy / S3 mañana).
 * Acepta absolutas, blob/data (previews) y paths relativos `/files/:id`.
 */
export function resolveMediaUrl(url: string | null | undefined): string {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;

  const base = env.NEXT_PUBLIC_API_URL.replace(/\/$/, '');
  return url.startsWith('/') ? `${base}${url}` : `${base}/${url}`;
}

/** Construye URL pública desde un fileId (entity anidada del API). */
export function resolveFileIdUrl(fileId: string | null | undefined): string {
  if (!fileId) return '';
  return resolveMediaUrl(`/files/${fileId}`);
}
