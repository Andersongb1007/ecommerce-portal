import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { logger } from '@/lib/logger';
import { isJwtUsable } from '@/lib/auth/jwt';
import {
  ACCESS_TOKEN_MAX_AGE,
  REFRESH_TOKEN_MAX_AGE,
  REFRESHED_ACCESS_TOKEN_HEADER,
  getSecureCookieOptions,
  refreshTokensWithBackend,
} from '@/lib/auth/refreshTokens';

function applyRefreshedCookies(
  response: NextResponse,
  tokens: { accessToken: string; refreshToken: string }
) {
  response.cookies.set(
    'accessToken',
    tokens.accessToken,
    getSecureCookieOptions(ACCESS_TOKEN_MAX_AGE)
  );
  response.cookies.set(
    'refreshToken',
    tokens.refreshToken,
    getSecureCookieOptions(REFRESH_TOKEN_MAX_AGE)
  );
  return response;
}

function redirectToLogin(request: NextRequest, pathname: string) {
  const loginUrl = new URL('/auth/login', request.url);
  if (pathname !== '/') {
    loginUrl.searchParams.set('redirect', pathname);
  }
  const response = NextResponse.redirect(loginUrl);
  response.cookies.delete('accessToken');
  response.cookies.delete('refreshToken');
  response.cookies.delete('userSession');
  return response;
}

function continueWithRefreshedAccess(
  request: NextRequest,
  accessToken: string,
  tokens?: { accessToken: string; refreshToken: string }
) {
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(REFRESHED_ACCESS_TOKEN_HEADER, accessToken);

  const response = NextResponse.next({
    request: { headers: requestHeaders },
  });

  if (tokens) {
    applyRefreshedCookies(response, tokens);
  }

  return response;
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isAuthPage = pathname.startsWith('/auth');

  const accessToken = request.cookies.get('accessToken')?.value;
  const refreshToken = request.cookies.get('refreshToken')?.value;
  const accessTokenValid = isJwtUsable(accessToken);

  if (accessTokenValid && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  if (accessTokenValid) {
    return NextResponse.next();
  }

  if (refreshToken) {
    const tokens = await refreshTokensWithBackend(refreshToken);

    if (tokens) {
      if (isAuthPage) {
        const response = NextResponse.redirect(new URL('/', request.url));
        return applyRefreshedCookies(response, tokens);
      }

      return continueWithRefreshedAccess(request, tokens.accessToken, tokens);
    }

    logger.warn({ msg: 'Refresh de sesión fallido en proxy', pathname });
  }

  if (isAuthPage) {
    return NextResponse.next();
  }

  return redirectToLogin(request, pathname);
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|images|favicon.ico).*)'],
};
