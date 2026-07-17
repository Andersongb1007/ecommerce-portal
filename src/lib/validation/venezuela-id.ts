export type CedulaLetter = 'V' | 'E';
export type RifLetter = 'V' | 'E' | 'J' | 'G' | 'P' | 'C';

export type IdValidationResult = {
  valid: boolean;
  message: string;
  normalized: string;
};

const RIF_TYPE_VALUES: Record<RifLetter, number> = {
  V: 4,
  E: 8,
  J: 12,
  C: 12,
  P: 16,
  G: 20,
};

/** Pesos SENIAT / stdnum para los 8 dígitos del cuerpo. */
const RIF_WEIGHTS = [3, 2, 7, 6, 5, 4, 3, 2] as const;

/** Tabla módulo 11 usada por SENIAT (equivalente a 11 - r, con 10/11 → 0). */
const RIF_CHECK_TABLE = '00987654321';

export function compactVenezuelaId(value: string): string {
  return value.replace(/[\s.-]/g, '').toUpperCase();
}

/**
 * Formatea cédula mientras se escribe: V-12345678
 * Solo letras V/E y 5–8 dígitos.
 */
export function formatCedulaInput(raw: string): string {
  const compact = compactVenezuelaId(raw).replace(/[^VE0-9]/g, '');
  if (!compact) return '';

  let letter = '';
  let digits = compact;

  if (/^[VE]/.test(compact)) {
    letter = compact[0];
    digits = compact.slice(1);
  }

  digits = digits.replace(/\D/g, '').slice(0, 8);
  if (!letter && digits) return digits;
  if (letter && !digits) return `${letter}-`;
  if (letter) return `${letter}-${digits}`;
  return digits;
}

export function validateCedula(value: string): IdValidationResult {
  const compact = compactVenezuelaId(value);

  if (!compact) {
    return { valid: false, message: 'Ingresa tu cédula (ej: V-12345678)', normalized: '' };
  }

  if (!/^[VE]\d{5,8}$/.test(compact)) {
    if (!/^[VE]/.test(compact)) {
      return {
        valid: false,
        message: 'La cédula debe iniciar con V (venezolano) o E (extranjero)',
        normalized: formatCedulaInput(value),
      };
    }
    if (compact.length < 6) {
      return {
        valid: false,
        message: 'La cédula debe tener entre 5 y 8 dígitos después de la letra',
        normalized: formatCedulaInput(value),
      };
    }
    return {
      valid: false,
      message: 'Formato inválido. Usa V-######## o E-########',
      normalized: formatCedulaInput(value),
    };
  }

  const letter = compact[0] as CedulaLetter;
  const digits = compact.slice(1);
  const normalized = `${letter}-${digits}`;

  return {
    valid: true,
    message: 'Cédula válida',
    normalized,
  };
}

/**
 * Formatea RIF: J-12345678-9
 */
export function formatRifInput(raw: string): string {
  const cleaned = compactVenezuelaId(raw).replace(/[^VEJPGC0-9]/g, '');
  if (!cleaned) return '';

  let letter = '';
  let rest = cleaned;

  if (/^[VEJPGC]/.test(cleaned)) {
    letter = cleaned[0];
    rest = cleaned.slice(1);
  }

  const digits = rest.replace(/\D/g, '').slice(0, 9);
  if (!letter && digits) return digits;
  if (letter && digits.length === 0) return `${letter}-`;
  if (letter && digits.length <= 8) return `${letter}-${digits}`;
  if (letter && digits.length >= 9) {
    return `${letter}-${digits.slice(0, 8)}-${digits.slice(8, 9)}`;
  }
  return digits;
}

/** Calcula el dígito verificador SENIAT para letra + 8 dígitos. */
export function calculateRifCheckDigit(letter: RifLetter, body8: string): string {
  const padded = body8.replace(/\D/g, '').padStart(8, '0').slice(-8);
  let sum = RIF_TYPE_VALUES[letter];
  for (let i = 0; i < 8; i += 1) {
    sum += RIF_WEIGHTS[i] * Number(padded[i]);
  }
  return RIF_CHECK_TABLE[sum % 11]!;
}

export function validateRif(value: string): IdValidationResult {
  const compact = compactVenezuelaId(value);
  const formatted = formatRifInput(value);

  if (!compact) {
    return {
      valid: false,
      message: 'Ingresa el RIF (ej: J-30468971-3)',
      normalized: '',
    };
  }

  if (!/^[VEJPGC]\d{9}$/.test(compact)) {
    if (!/^[VEJPGC]/.test(compact)) {
      return {
        valid: false,
        message: 'El RIF debe iniciar con V, E, J, G, P o C',
        normalized: formatted,
      };
    }
    if (compact.length < 10) {
      return {
        valid: false,
        message: 'Formato incompleto. Debe ser Letra-########-# (10 caracteres)',
        normalized: formatted,
      };
    }
    return {
      valid: false,
      message: 'Formato inválido. Usa J-########-# (SENIAT)',
      normalized: formatted,
    };
  }

  const letter = compact[0] as RifLetter;
  const body = compact.slice(1, 9);
  const checkDigit = compact[9]!;
  const expected = calculateRifCheckDigit(letter, body);

  if (checkDigit !== expected) {
    return {
      valid: false,
      message: `Dígito verificador incorrecto. Según SENIAT debería ser ${expected} (ej: ${letter}-${body}-${expected})`,
      normalized: `${letter}-${body}-${checkDigit}`,
    };
  }

  return {
    valid: true,
    message: 'RIF válido (SENIAT)',
    normalized: `${letter}-${body}-${checkDigit}`,
  };
}

export function isValidCedula(value: string): boolean {
  return validateCedula(value).valid;
}

export function isValidRif(value: string): boolean {
  return validateRif(value).valid;
}

export const CEDULA_LETTERS: CedulaLetter[] = ['V', 'E'];
export const RIF_LETTERS: RifLetter[] = ['V', 'E', 'J', 'G', 'P', 'C'];

export function parseCedulaParts(value: string): { letter: CedulaLetter; digits: string } {
  const compact = compactVenezuelaId(value);
  if (/^[VE]/.test(compact)) {
    return {
      letter: compact[0] as CedulaLetter,
      digits: compact.slice(1).replace(/\D/g, '').slice(0, 8),
    };
  }
  return { letter: 'V', digits: compact.replace(/\D/g, '').slice(0, 8) };
}

export function composeCedula(letter: CedulaLetter, digits: string): string {
  const d = digits.replace(/\D/g, '').slice(0, 8);
  if (!d) return '';
  return `${letter}-${d}`;
}

export function parseRifParts(value: string): { letter: RifLetter; body: string; check: string } {
  const compact = compactVenezuelaId(value);
  if (/^[VEJPGC]/.test(compact)) {
    const rest = compact.slice(1).replace(/\D/g, '');
    return {
      letter: compact[0] as RifLetter,
      body: rest.slice(0, 8),
      check: rest.slice(8, 9),
    };
  }
  const digits = compact.replace(/\D/g, '');
  return { letter: 'J', body: digits.slice(0, 8), check: digits.slice(8, 9) };
}

export function composeRif(letter: RifLetter, body: string, check: string): string {
  const b = body.replace(/\D/g, '').slice(0, 8);
  const c = check.replace(/\D/g, '').slice(0, 1);
  if (!b && !c) return '';
  if (b.length < 8 || !c) return `${letter}-${b}${c ? `-${c}` : ''}`;
  return `${letter}-${b}-${c}`;
}
