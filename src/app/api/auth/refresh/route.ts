import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiHandler } from '@/lib/error/apiHandler';
import { UnauthorizedError } from '@/lib/error/AppError';
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  getSecureCookieOptions,
  refreshTokensWithBackend,
} from '@/lib/auth/refreshTokens';

export const POST = apiHandler(async () => {
  const cookieStore = await cookies();
  const currentRefreshToken = cookieStore.get('refreshToken')?.value;

  if (!currentRefreshToken) {
    throw new UnauthorizedError(
      'No se encontró el token de refresco de sesión',
      'REFRESH_TOKEN_NOT_FOUND'
    );
  }

  const data = await refreshTokensWithBackend(currentRefreshToken);

  if (!data) {
    throw new UnauthorizedError('No se pudo renovar la sesión', 'REFRESH_FAILED');
  }

  cookieStore.set('accessToken', data.accessToken, getSecureCookieOptions(ACCESS_TOKEN_MAX_AGE));
  cookieStore.set('refreshToken', data.refreshToken, getSecureCookieOptions(REFRESH_TOKEN_MAX_AGE));

  return NextResponse.json({
    success: true,
    accessToken: data.accessToken,
  });
});
