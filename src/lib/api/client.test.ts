import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { apiRequest } from './client';
import {
  AppError,
  UnauthorizedError,
  ForbiddenError,
  NotFoundError,
  BadRequestError,
} from '../error/AppError';

// Mockear variables de entorno para los tests
vi.mock('@/lib/validation/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:3001',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
  },
}));

describe('apiRequest client test suite', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    vi.stubGlobal('fetch', mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('debe realizar un fetch exitoso y retornar JSON cuando responde 200 ok', async () => {
    const mockResponse = { data: 'test_success' };
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => mockResponse,
    });

    const result = await apiRequest<{ data: string }>('/test-route');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://localhost:3001/test-route',
      expect.objectContaining({
        headers: expect.any(Headers),
      })
    );
    expect(result).toEqual(mockResponse);
  });

  it('debe inyectar la cabecera Authorization Bearer si se le pasa un token', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 200,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ success: true }),
    });

    await apiRequest('/test-route', { token: 'my_jwt_token' });

    const calledOptions = mockFetch.mock.calls[0][1] as RequestInit;
    const headers = calledOptions.headers as Headers;

    expect(headers.get('Authorization')).toBe('Bearer my_jwt_token');
  });

  it('debe lanzar BadRequestError si el backend responde con estado 400', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 400,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ error: { message: 'Datos incorrectos', code: 'BAD_REQUEST_ERROR' } }),
    });

    let caughtError: unknown;
    try {
      await apiRequest('/bad-route');
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(BadRequestError);
    expect((caughtError as BadRequestError).message).toBe('Datos incorrectos');
  });

  it('debe lanzar UnauthorizedError si el backend responde con estado 401', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ error: { message: 'Token expirado', code: 'JWT_EXPIRED' } }),
    });

    let caughtError: unknown;
    try {
      await apiRequest('/auth-route');
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(UnauthorizedError);
    expect((caughtError as UnauthorizedError).message).toBe('Token expirado');
  });

  it('debe lanzar ForbiddenError si el backend responde con estado 403', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 403,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ message: 'No posees permisos de administrador' }),
    });

    let caughtError: unknown;
    try {
      await apiRequest('/forbidden-route');
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(ForbiddenError);
    expect((caughtError as ForbiddenError).message).toBe('No posees permisos de administrador');
  });

  it('debe lanzar NotFoundError si el backend responde con estado 404', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 404,
      headers: new Headers({ 'Content-Type': 'application/json' }),
      json: async () => ({ error: { message: 'Usuario no encontrado', code: 'USER_NOT_FOUND' } }),
    });

    let caughtError: unknown;
    try {
      await apiRequest('/notfound-route');
    } catch (err) {
      caughtError = err;
    }

    expect(caughtError).toBeInstanceOf(NotFoundError);
    expect((caughtError as NotFoundError).message).toBe('Usuario no encontrado');
  });

  it('debe retornar null sin intentar parsear JSON si responde 204 No Content', async () => {
    mockFetch.mockResolvedValueOnce({
      ok: true,
      status: 204,
      headers: new Headers(),
    });

    const result = await apiRequest('/delete-route', { method: 'DELETE' });
    expect(result).toBeNull();
  });
});
