import { describe, expect, it } from 'vitest';
import { formatPhoneInput, validateVePhone } from './venezuela-phone';

describe('validateVePhone', () => {
  it('acepta prefijos móviles venezolanos', () => {
    for (const prefix of ['0412', '0414', '0416', '0422', '0424', '0426']) {
      const result = validateVePhone(`${prefix}-1234567`);
      expect(result.valid).toBe(true);
      expect(result.normalized).toBe(`${prefix}-1234567`);
    }
  });

  it('convierte +58 al formato local', () => {
    expect(formatPhoneInput('+584121234567')).toBe('0412-1234567');
    expect(validateVePhone('+58 424 1112233').normalized).toBe('0424-1112233');
  });

  it('rechaza prefijos fijos u otros países', () => {
    expect(validateVePhone('0212-1234567').valid).toBe(false);
    expect(validateVePhone('+573001234567').valid).toBe(false);
    expect(validateVePhone('0412-1234567').message).toBe('Teléfono válido');
  });

  it('rechaza longitud incompleta', () => {
    const result = validateVePhone('0412-123');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/11 dígitos/i);
  });
});
