import { cookies, headers } from 'next/headers';
import { isJwtUsable } from '@/lib/auth/jwt';
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  REFRESHED_ACCESS_TOKEN_HEADER,
  getSecureCookieOptions,
  refreshTokensWithBackend,
} from '@/lib/auth/refreshTokens';

/** Token para SSR: primero el renovado por proxy, luego cookie, luego refresh único. */
export async function resolveServerAccessToken(): Promise<string | undefined> {
  const headerStore = await headers();
  const headerToken = headerStore.get(REFRESHED_ACCESS_TOKEN_HEADER);
  if (isJwtUsable(headerToken ?? undefined)) {
    return headerToken!;
  }

  const cookieStore = await cookies();
  const cookieAccess = cookieStore.get('accessToken')?.value;
  if (isJwtUsable(cookieAccess)) {
    return cookieAccess;
  }

  const refreshToken = cookieStore.get('refreshToken')?.value;
  if (!refreshToken) {
    return undefined;
  }

  const tokens = await refreshTokensWithBackend(refreshToken);
  if (!tokens) {
    return undefined;
  }

  cookieStore.set('accessToken', tokens.accessToken, getSecureCookieOptions(ACCESS_TOKEN_MAX_AGE));
  cookieStore.set(
    'refreshToken',
    tokens.refreshToken,
    getSecureCookieOptions(REFRESH_TOKEN_MAX_AGE)
  );

  return tokens.accessToken;
}

/** Token para BFF (sin header de proxy): cookie válida o un refresh. */
export async function resolveCookieAccessToken(): Promise<string | undefined> {
  const cookieStore = await cookies();
  const cookieAccess = cookieStore.get('accessToken')?.value;
  if (isJwtUsable(cookieAccess)) {
    return cookieAccess;
  }

  const refreshToken = cookieStore.get('refreshToken')?.value;
  if (!refreshToken) {
    return undefined;
  }

  const tokens = await refreshTokensWithBackend(refreshToken);
  if (!tokens) {
    return undefined;
  }

  cookieStore.set('accessToken', tokens.accessToken, getSecureCookieOptions(ACCESS_TOKEN_MAX_AGE));
  cookieStore.set(
    'refreshToken',
    tokens.refreshToken,
    getSecureCookieOptions(REFRESH_TOKEN_MAX_AGE)
  );

  return tokens.accessToken;
}
