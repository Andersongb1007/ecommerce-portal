import { describe, expect, it } from 'vitest';
import { companyRegisterSchema, companyOnboardingSchema } from '@/lib/validation/auth';

describe('companyRegisterSchema (mínimo)', () => {
  it('acepta email, password y rif válidos', () => {
    const result = companyRegisterSchema.safeParse({
      accountType: 2,
      email: 'tienda@ejemplo.com',
      password: 'Secret123',
      rif: 'j-30468971-3',
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.rif).toBe('J-30468971-3');
    }
  });

  it('rechaza password débil', () => {
    const result = companyRegisterSchema.safeParse({
      accountType: 2,
      email: 'tienda@ejemplo.com',
      password: 'secret123',
      rif: 'J-30468971-3',
    });

    expect(result.success).toBe(false);
  });

  it('rechaza rif inválido', () => {
    const result = companyRegisterSchema.safeParse({
      accountType: 2,
      email: 'tienda@ejemplo.com',
      password: 'Secret123',
      rif: '123',
    });

    expect(result.success).toBe(false);
  });

  it('rechaza rif con dígito verificador incorrecto', () => {
    const result = companyRegisterSchema.safeParse({
      accountType: 2,
      email: 'tienda@ejemplo.com',
      password: 'Secret123',
      rif: 'J-12345678-9',
    });

    expect(result.success).toBe(false);
  });
});

describe('companyOnboardingSchema', () => {
  it('acepta payload completo sin slug (lo genera la API)', () => {
    const result = companyOnboardingSchema.safeParse({
      firstName: 'Ana',
      lastName: 'Pérez',
      cedula: 'V-12345678',
      phoneNumber: '0412-1234567',
      name: 'Mi Tienda',
      address: 'Calle Principal 1',
    });

    expect(result.success).toBe(true);
  });

  it('rechaza nombre demasiado corto', () => {
    const result = companyOnboardingSchema.safeParse({
      firstName: 'Ana',
      lastName: 'Pérez',
      cedula: 'V-12345678',
      phoneNumber: '0412-1234567',
      name: 'A',
      address: 'Calle Principal 1',
    });

    expect(result.success).toBe(false);
  });
});
