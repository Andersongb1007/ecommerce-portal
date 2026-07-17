import type { Metadata } from 'next';
import { RegisterForm } from '@/components/auth/RegisterForm';

export const metadata: Metadata = {
  title: 'Registrar empresa | Portal Empresa',
  description: 'Crea tu cuenta de comercio para gestionar catálogo y vitrina.',
};

export default function RegisterPage() {
  return <RegisterForm />;
}
