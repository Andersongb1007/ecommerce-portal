import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/lib/validation/env';
import { portalPaths } from '@/lib/api/portal-paths';
import { apiHandler } from '@/lib/error/apiHandler';
import { AppError, ValidationError } from '@/lib/error/AppError';
import { companyRegisterSchema } from '@/lib/validation/auth';
import { validateMinimalCompanyRegister } from '@/lib/auth/validate-minimal-register';

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
  company?: Record<string, unknown>;
}

export const POST = apiHandler(async (req: Request) => {
  const formData = await req.formData();
  const validation = validateMinimalCompanyRegister(formData);
  if (!validation.ok) {
    throw new ValidationError(validation.message);
  }

  const { email, password, rif, rifDocument } = validation.data;
  const body = new FormData();
  body.set('accountType', '2');
  body.set('email', email);
  body.set('password', password);
  body.set('rif', rif);
  body.append('rifDocument', rifDocument);

  const parsed = companyRegisterSchema.safeParse({
    accountType: 2,
    email,
    password,
    rif,
  });
  if (!parsed.success) {
    throw new ValidationError(parsed.error.issues[0]?.message ?? 'Datos inválidos');
  }

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${portalPaths.auth.register}`, {
    method: 'POST',
    body,
  });

  const payload = (await response.json().catch(() => null)) as
    | RegisterResponse
    | {
        message?: string;
        error?: { message?: string };
      }
    | null;

  if (!response.ok) {
    const message =
      (payload && 'error' in payload && payload.error?.message) ||
      (payload && 'message' in payload && payload.message) ||
      'No se pudo completar el registro';
    throw new AppError(String(message), response.status, 'REGISTER_FAILED');
  }

  const data = payload as RegisterResponse;
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

  const sessionUser = {
    ...data.user,
    userCompanyRoles: data.company
      ? [{ company: data.company, role: { name: 'OWNER' } }]
      : (data.user as { userCompanyRoles?: unknown }).userCompanyRoles,
  };

  cookieStore.set('userSession', JSON.stringify(sessionUser), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return NextResponse.json({
    success: true,
    user: sessionUser,
    company: data.company ?? null,
  });
});
