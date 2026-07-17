export type PhoneValidationResult = {
  valid: boolean;
  message: string;
  normalized: string;
};

/** Prefijos móviles venezolanos (con el 0 local). */
export const VE_MOBILE_PREFIXES = ['0412', '0414', '0416', '0422', '0424', '0426'] as const;

export type VeMobilePrefix = (typeof VE_MOBILE_PREFIXES)[number];

/** Solo dígitos, normalizando +58 / 58 / 4XX → 0XXX… */
export function compactVePhone(value: string): string {
  let digits = value.replace(/\D/g, '');

  if (digits.startsWith('58') && digits.length >= 12) {
    digits = digits.slice(2);
  }

  if (/^4(12|14|16|22|24|26)/.test(digits)) {
    digits = `0${digits}`;
  }

  return digits.slice(0, 11);
}

/**
 * Formatea mientras se escribe: 0412-1234567
 * Acepta pegar +584121234567 y lo convierte.
 */
export function formatPhoneInput(raw: string): string {
  const digits = compactVePhone(raw);
  if (!digits) return '';
  if (digits.length <= 4) return digits;
  return `${digits.slice(0, 4)}-${digits.slice(4)}`;
}

export function validateVePhone(value: string): PhoneValidationResult {
  const digits = compactVePhone(value);
  const formatted = formatPhoneInput(value);

  if (!digits) {
    return {
      valid: false,
      message: 'Ingresa tu teléfono (ej: 0412-1234567)',
      normalized: '',
    };
  }

  const prefix = digits.slice(0, 4) as VeMobilePrefix;
  const isKnownPrefix = (VE_MOBILE_PREFIXES as readonly string[]).includes(prefix);

  if (digits.length < 11) {
    if (digits.length >= 4 && !isKnownPrefix) {
      return {
        valid: false,
        message: 'Prefijo inválido. Usa 0412, 0414, 0416, 0422, 0424 o 0426',
        normalized: formatted,
      };
    }
    return {
      valid: false,
      message: 'El teléfono debe tener 11 dígitos (ej: 0412-1234567)',
      normalized: formatted,
    };
  }

  if (!isKnownPrefix) {
    return {
      valid: false,
      message: 'Prefijo inválido. Usa 0412, 0414, 0416, 0422, 0424 o 0426',
      normalized: formatted,
    };
  }

  if (!/^0(412|414|416|422|424|426)\d{7}$/.test(digits)) {
    return {
      valid: false,
      message: 'Formato inválido. Usa 0412-#######',
      normalized: formatted,
    };
  }

  const normalized = `${digits.slice(0, 4)}-${digits.slice(4)}`;
  return {
    valid: true,
    message: 'Teléfono válido',
    normalized,
  };
}

export function isValidVePhone(value: string): boolean {
  return validateVePhone(value).valid;
}

export function parsePhoneParts(value: string): { prefix: VeMobilePrefix; number: string } {
  const digits = compactVePhone(value);
  const maybePrefix = digits.slice(0, 4);
  if ((VE_MOBILE_PREFIXES as readonly string[]).includes(maybePrefix)) {
    return { prefix: maybePrefix as VeMobilePrefix, number: digits.slice(4, 11) };
  }
  return { prefix: '0412', number: digits.slice(0, 7) };
}

export function composePhone(prefix: VeMobilePrefix, number: string): string {
  const n = number.replace(/\D/g, '').slice(0, 7);
  if (!n) return '';
  return `${prefix}-${n}`;
}
