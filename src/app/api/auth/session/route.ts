import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiHandler } from '@/lib/error/apiHandler';
import { sessionUserSchema } from '@/lib/validation/auth';
import { ValidationError } from '@/lib/error/AppError';

export const POST = apiHandler(async (req: Request) => {
  const body = (await req.json()) as unknown;
  const validation = sessionUserSchema.safeParse(
    typeof body === 'object' && body !== null && 'user' in body
      ? (body as { user: unknown }).user
      : body
  );

  if (!validation.success) {
    throw new ValidationError('Datos de sesión inválidos');
  }

  const cookieStore = await cookies();
  cookieStore.set('userSession', JSON.stringify(validation.data), {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60,
    path: '/',
  });

  return NextResponse.json({
    success: true,
    user: validation.data,
  });
});
