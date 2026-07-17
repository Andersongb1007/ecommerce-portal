import { NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { apiHandler } from '@/lib/error/apiHandler';

export const POST = apiHandler(async () => {
  const cookieStore = await cookies();

  // Eliminar las cookies de sesión
  cookieStore.delete('accessToken');
  cookieStore.delete('refreshToken');
  cookieStore.delete('userSession');

  return NextResponse.json({
    success: true,
  });
});
