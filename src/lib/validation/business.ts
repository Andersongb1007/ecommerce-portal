import { z } from 'zod';
import { isValidCedula, isValidRif, validateCedula, validateRif } from './venezuela-id';
import { isValidVePhone, validateVePhone } from './venezuela-phone';

/** @deprecated Prefer phoneSchema / validateVePhone (móviles VE). */
export const phoneRegex = /^0(412|414|416|422|424|426)-\d{7}$/;
export const hexColorRegex = /^#[0-9a-fA-F]{6}$/;
export const slugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** @deprecated Prefer validateRif / isValidRif (incluye dígito SENIAT). */
export const rifRegex = /^[VEJPGC]-\d{8}-\d$/i;
/** @deprecated Prefer validateCedula / isValidCedula. */
export const cedulaRegex = /^[VE]-\d{5,8}$/i;

export const cedulaSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const result = validateCedula(value);
    if (!result.valid) {
      ctx.addIssue({ code: 'custom', message: result.message });
    }
  })
  .transform((value) => validateCedula(value).normalized);

export const rifSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const result = validateRif(value);
    if (!result.valid) {
      ctx.addIssue({ code: 'custom', message: result.message });
    }
  })
  .transform((value) => validateRif(value).normalized);

export const phoneSchema = z
  .string()
  .trim()
  .superRefine((value, ctx) => {
    const result = validateVePhone(value);
    if (!result.valid) {
      ctx.addIssue({ code: 'custom', message: result.message });
    }
  })
  .transform((value) => validateVePhone(value).normalized);

export { isValidCedula, isValidRif, isValidVePhone, validateCedula, validateRif, validateVePhone };
