import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { env } from '@/lib/validation/env';
import { resolveCookieAccessToken } from '@/lib/auth/serverAccessToken';

export async function forwardPortalRequest(
  request: NextRequest,
  pathSegments: string[]
): Promise<NextResponse> {
  const apiPath = `/${pathSegments.join('/')}`;
  const targetUrl = `${env.NEXT_PUBLIC_API_URL}${apiPath}${request.nextUrl.search}`;

  const headers = new Headers();
  const contentType = request.headers.get('content-type');
  if (contentType) {
    headers.set('content-type', contentType);
  }

  const body =
    request.method === 'GET' || request.method === 'HEAD' ? undefined : await request.arrayBuffer();

  const doFetch = async (token?: string) => {
    const reqHeaders = new Headers(headers);
    if (token) {
      reqHeaders.set('Authorization', `Bearer ${token}`);
    }

    return fetch(targetUrl, {
      method: request.method,
      headers: reqHeaders,
      body: body?.byteLength ? body : undefined,
    });
  };

  const accessToken = await resolveCookieAccessToken();
  const response = await doFetch(accessToken);

  const responseHeaders = new Headers();
  const responseContentType = response.headers.get('content-type');
  if (responseContentType) {
    responseHeaders.set('content-type', responseContentType);
  }

  return new NextResponse(await response.arrayBuffer(), {
    status: response.status,
    headers: responseHeaders,
  });
}
