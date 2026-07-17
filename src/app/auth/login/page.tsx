import type { Metadata } from 'next';
import { LoginForm } from '@/components/auth/LoginForm';

export const metadata: Metadata = {
  title: 'Iniciar Sesión | Portal Empresa',
  description: 'Accede al portal de tu comercio para gestionar productos y vitrina.',
};

export default function LoginPage() {
  return <LoginForm />;
}
