import type { NextRequest } from 'next/server';
import { forwardPortalRequest } from '@/lib/auth/forwardPortalRequest';

type RouteContext = { params: Promise<{ path: string[] }> };

async function handle(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return forwardPortalRequest(request, path);
}

export const GET = handle;
export const POST = handle;
export const PUT = handle;
export const PATCH = handle;
export const DELETE = handle;
