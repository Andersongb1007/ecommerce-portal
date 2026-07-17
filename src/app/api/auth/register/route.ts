import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { env } from '@/lib/validation/env';
import { portalPaths } from '@/lib/api/portal-paths';
import { apiHandler } from '@/lib/error/apiHandler';
import { AppError, ValidationError } from '@/lib/error/AppError';

interface RegisterResponse {
  accessToken: string;
  refreshToken: string;
  user: Record<string, unknown>;
  company?: Record<string, unknown>;
}

export const POST = apiHandler(async (req: Request) => {
  const formData = await req.formData();

  const required = [
    'firstName',
    'lastName',
    'email',
    'password',
    'cedula',
    'phoneNumber',
    'name',
    'slug',
    'rif',
    'address',
  ] as const;

  for (const field of required) {
    const value = formData.get(field);
    if (typeof value !== 'string' || !value.trim()) {
      throw new ValidationError(`Campo obligatorio: ${field}`);
    }
  }

  if (!(formData.get('rifDocument') instanceof File)) {
    throw new ValidationError('Debes adjuntar el documento RIF (PDF o imagen)');
  }

  formData.set('accountType', '2');

  const response = await fetch(`${env.NEXT_PUBLIC_API_URL}${portalPaths.auth.register}`, {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json().catch(() => null)) as RegisterResponse | {
    message?: string;
    error?: { message?: string };
  } | null;

  if (!response.ok) {
    const message =
      (payload && 'error' in payload && payload.error?.message) ||
      (payload && 'message' in payload && payload.message) ||
      'No se pudo completar el registro';
    throw new AppError(message, response.status, 'REGISTER_FAILED');
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

  // Adjuntar company al userSession para el dashboard OWNER
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
