import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiRequest } from '@/lib/api/client';
import { portalPaths } from '@/lib/api/portal-paths';
import { apiHandler } from '@/lib/error/apiHandler';
import { loginSchema } from '@/lib/validation/auth';
import { ValidationError } from '@/lib/error/AppError';

interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    cedula?: string;
    rif?: string;
    phoneNumber: string;
    roles: string[];
  };
}

export const POST = apiHandler(async (req: Request) => {
  const body = (await req.json()) as unknown;

  const validation = loginSchema.safeParse(body);
  if (!validation.success) {
    throw new ValidationError('Credenciales con formato inválido');
  }

  const { email, password } = validation.data;

  const data = await apiRequest<LoginResponse>(portalPaths.auth.login, {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });

  const cookieStore = await cookies();

  cookieStore.set('accessToken', data.accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60,
    path: '/',
  });

  cookieStore.set('refreshToken', data.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  cookieStore.set('userSession', JSON.stringify(data.user), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return NextResponse.json({
    success: true,
    user: data.user,
  });
});
