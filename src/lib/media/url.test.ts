import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/lib/validation/env', () => ({
  env: {
    NEXT_PUBLIC_API_URL: 'http://localhost:8080',
    NEXT_PUBLIC_APP_URL: 'http://localhost:3002',
    NEXT_PUBLIC_ADMIN_URL: 'http://localhost:3000',
    NEXT_PUBLIC_CUSTOMER_APP_URL: 'http://localhost:3001',
    NEXT_PUBLIC_PORTAL_URL: 'http://localhost:3002',
  },
}));

describe('resolveMediaUrl', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('prefija el API en paths relativos /files/:id', async () => {
    const { resolveMediaUrl } = await import('./url');
    expect(resolveMediaUrl('/files/abc-123')).toBe('http://localhost:8080/files/abc-123');
  });

  it('deja absolutas y blob intactas', async () => {
    const { resolveMediaUrl } = await import('./url');
    expect(resolveMediaUrl('http://localhost:8080/files/abc')).toBe(
      'http://localhost:8080/files/abc'
    );
    expect(resolveMediaUrl('blob:http://localhost:3002/xyz')).toBe(
      'blob:http://localhost:3002/xyz'
    );
    expect(resolveMediaUrl('data:image/png;base64,xx')).toBe('data:image/png;base64,xx');
  });

  it('devuelve vacío si no hay url', async () => {
    const { resolveMediaUrl } = await import('./url');
    expect(resolveMediaUrl(null)).toBe('');
    expect(resolveMediaUrl(undefined)).toBe('');
  });
});
