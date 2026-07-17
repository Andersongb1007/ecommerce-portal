import { env } from '@/lib/validation/env';
import { portalPaths } from '@/lib/api/portal-paths';

export interface RefreshTokensResponse {
  accessToken: string;
  refreshToken: string;
}

export async function refreshTokensWithBackend(
  refreshToken: string
): Promise<RefreshTokensResponse | null> {
  try {
    const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${portalPaths.auth.refresh}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!response.ok) return null;

    return (await response.json()) as RefreshTokensResponse;
  } catch {
    return null;
  }
}

export const ACCESS_TOKEN_MAX_AGE = 15 * 60;
export const REFRESH_TOKEN_MAX_AGE = 7 * 24 * 60 * 60;
export const REFRESHED_ACCESS_TOKEN_HEADER = 'x-access-token';

export function getSecureCookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    maxAge,
    path: '/',
  };
}
