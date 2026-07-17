import { apiRequest, type RequestOptions } from './client';
import { UnauthorizedError } from '../error/AppError';
import { resolveServerAccessToken } from '@/lib/auth/serverAccessToken';

export async function serverApiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const accessToken = await resolveServerAccessToken();

  if (!accessToken) {
    throw new UnauthorizedError('Sesión no válida o expirada', 'SESSION_EXPIRED');
  }

  return apiRequest<T>(path, {
    ...options,
    token: accessToken,
  });
}
