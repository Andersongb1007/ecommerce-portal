import { describe, expect, it } from 'vitest';
import { validateMinimalCompanyRegister } from '@/lib/auth/validate-minimal-register';

describe('validateMinimalCompanyRegister', () => {
  it('falla sin email', () => {
    const form = new FormData();
    form.set('password', 'Secret123');
    form.set('rif', 'J-30468971-3');
    form.append('rifDocument', new File(['pdf'], 'rif.pdf', { type: 'application/pdf' }));

    const result = validateMinimalCompanyRegister(form);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toContain('email');
    }
  });

  it('falla sin rifDocument', () => {
    const form = new FormData();
    form.set('email', 'a@b.com');
    form.set('password', 'Secret123');
    form.set('rif', 'J-30468971-3');

    const result = validateMinimalCompanyRegister(form);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.message).toMatch(/RIF/i);
    }
  });

  it('acepta FormData mínimo válido', () => {
    const form = new FormData();
    form.set('email', 'tienda@ejemplo.com');
    form.set('password', 'Secret123');
    form.set('rif', 'J-30468971-3');
    form.append('rifDocument', new File(['pdf'], 'rif.pdf', { type: 'application/pdf' }));

    const result = validateMinimalCompanyRegister(form);
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.email).toBe('tienda@ejemplo.com');
      expect(result.data.rifDocument.name).toBe('rif.pdf');
    }
  });
});
