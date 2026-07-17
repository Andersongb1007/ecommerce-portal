import { describe, expect, it } from 'vitest';
import {
  calculateRifCheckDigit,
  formatCedulaInput,
  formatRifInput,
  validateCedula,
  validateRif,
} from './venezuela-id';

describe('validateCedula', () => {
  it('acepta V y E con 5–8 dígitos', () => {
    expect(validateCedula('V-12345678').valid).toBe(true);
    expect(validateCedula('e-12345').normalized).toBe('E-12345');
  });

  it('rechaza letras distintas de V/E', () => {
    const result = validateCedula('J-12345678');
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/V.*E/i);
  });

  it('formatea mientras se escribe', () => {
    expect(formatCedulaInput('v12345678')).toBe('V-12345678');
  });
});

describe('validateRif (SENIAT)', () => {
  it('acepta RIFs con dígito verificador correcto', () => {
    expect(validateRif('J-30468971-3')).toEqual({
      valid: true,
      message: 'RIF válido (SENIAT)',
      normalized: 'J-30468971-3',
    });
    expect(validateRif('V-11470283-4').valid).toBe(true);
    expect(validateRif('V-29577829-2')).toEqual({
      valid: true,
      message: 'RIF válido (SENIAT)',
      normalized: 'V-29577829-2',
    });
  });

  it('rechaza dígito verificador incorrecto y sugiere el correcto', () => {
    const result = validateRif('J-12345678-9');
    expect(result.valid).toBe(false);
    expect(result.message).toContain(calculateRifCheckDigit('J', '12345678'));
  });

  it('calcula dígitos conocidos', () => {
    expect(calculateRifCheckDigit('J', '30468971')).toBe('3');
    expect(calculateRifCheckDigit('V', '11470283')).toBe('4');
  });

  it('formatea RIF completo', () => {
    expect(formatRifInput('j304689713')).toBe('J-30468971-3');
  });
});
