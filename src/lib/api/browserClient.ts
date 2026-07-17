import { apiRequest, type RequestOptions } from './client';

export async function browserApiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const bffPath = `/api/bff${path.startsWith('/') ? path : `/${path}`}`;

  return apiRequest<T>(bffPath, {
    ...options,
    credentials: 'include',
  });
}
