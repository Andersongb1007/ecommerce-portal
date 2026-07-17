import { z } from 'zod';
import { phoneRegex, rifRegex } from './business';

export const cedulaRegex = /^[VE]-\d{5,9}$/i;
export const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;

export const loginSchema = z.object({
  email: z.string().email({ message: 'El correo electrónico no es válido' }),
  password: z.string().min(8, { message: 'La contraseña debe tener al menos 8 caracteres' }),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email({ message: 'El correo electrónico no es válido' }),
});

const companySlugRegex = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Registro de comercio (accountType=2) para el portal OWNER. */
export const companyRegisterSchema = z.object({
  accountType: z.literal(2),
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'El correo electrónico no es válido' }),
  password: z
    .string()
    .min(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
    .regex(strongPasswordRegex, {
      message: 'Debe incluir al menos una mayúscula, una minúscula y un número',
    }),
  cedula: z
    .string()
    .regex(cedulaRegex, { message: 'Formato de cédula inválido (ej: V-12345678)' })
    .transform((v) => v.toUpperCase()),
  phoneNumber: z.string().regex(phoneRegex, {
    message: 'El teléfono debe usar formato internacional (ej: +584121234567)',
  }),
  name: z.string().min(2, { message: 'El nombre de la empresa es obligatorio' }),
  slug: z
    .string()
    .min(3)
    .max(60)
    .regex(companySlugRegex, {
      message: 'Slug en minúsculas, números y guiones (ej: mi-tienda)',
    }),
  rif: z
    .string()
    .regex(rifRegex, { message: 'Formato de RIF inválido (ej: J-12345678-9)' })
    .transform((v) => v.toUpperCase()),
  address: z.string().min(5, { message: 'La dirección es obligatoria' }),
  bioDescription: z.string().max(150).optional(),
  themeColor: z
    .string()
    .regex(/^#[0-9A-Fa-f]{6}$/, { message: 'Color hexadecimal inválido' })
    .optional(),
});

export const adminProfileSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
  email: z.string().email({ message: 'El correo electrónico no es válido' }),
  phoneNumber: z.string().regex(phoneRegex, {
    message: 'El teléfono debe usar formato internacional (ej: +584121234567)',
  }),
  cedula: z
    .string()
    .regex(cedulaRegex, { message: 'Formato de cédula inválido (ej: V-12345678)' })
    .transform((v) => v.toUpperCase()),
  rif: z
    .string()
    .regex(rifRegex, { message: 'Formato de RIF inválido (ej: J-12345678-9)' })
    .transform((v) => v.toUpperCase()),
});

export const changePasswordFormSchema = z
  .object({
    currentPassword: z
      .string()
      .min(8, { message: 'La contraseña actual debe tener al menos 8 caracteres' }),
    newPassword: z
      .string()
      .min(8, { message: 'La nueva contraseña debe tener al menos 8 caracteres' })
      .regex(strongPasswordRegex, {
        message: 'Debe incluir al menos una mayúscula, una minúscula y un número',
      }),
    confirmPassword: z.string().min(8, { message: 'Confirma la nueva contraseña' }),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'Las contraseñas nuevas no coinciden',
    path: ['confirmPassword'],
  });

export const systemSettingsSchema = z.object({
  maintenanceMode: z.boolean(),
  maxUploadSizeMb: z.number().int().min(1).max(100),
});

export const sessionUserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  firstName: z.string(),
  lastName: z.string(),
  phoneNumber: z.string(),
  cedula: z.string().optional().nullable(),
  rif: z.string().optional().nullable(),
  roles: z.array(z.string()),
});
