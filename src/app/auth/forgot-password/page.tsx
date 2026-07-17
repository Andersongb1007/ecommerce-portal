import type { Metadata } from 'next';
import { ForgotPasswordForm } from '@/components/auth/ForgotPasswordForm';

export const metadata: Metadata = {
  title: 'Recuperar Contraseña | Portal Empresa',
  description: 'Recupera el acceso a tu cuenta restableciendo tu contraseña.',
};

export default function ForgotPasswordPage() {
  return <ForgotPasswordForm />;
}
