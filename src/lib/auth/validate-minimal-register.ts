/** Validación extraíble del FormData de registro mínimo (para tests). */
export type MinimalRegisterOk = {
  ok: true;
  data: {
    email: string;
    password: string;
    rif: string;
    rifDocument: File;
  };
};

export type MinimalRegisterFail = {
  ok: false;
  message: string;
};

export function validateMinimalCompanyRegister(
  formData: FormData
): MinimalRegisterOk | MinimalRegisterFail {
  const email = formData.get('email');
  const password = formData.get('password');
  const rif = formData.get('rif');
  const rifDocument = formData.get('rifDocument');

  if (typeof email !== 'string' || !email.trim()) {
    return { ok: false, message: 'Campo obligatorio: email' };
  }
  if (typeof password !== 'string' || !password.trim()) {
    return { ok: false, message: 'Campo obligatorio: password' };
  }
  if (typeof rif !== 'string' || !rif.trim()) {
    return { ok: false, message: 'Campo obligatorio: rif' };
  }
  if (!(rifDocument instanceof File) || rifDocument.size === 0) {
    return { ok: false, message: 'Debes adjuntar el documento RIF (PDF o imagen)' };
  }

  return {
    ok: true,
    data: {
      email: email.trim(),
      password,
      rif: rif.trim(),
      rifDocument,
    },
  };
}
