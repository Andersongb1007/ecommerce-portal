'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { forgotPasswordSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth/AuthShell';

export function ForgotPasswordForm() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    const validation = forgotPasswordSchema.safeParse({ email });
    if (!validation.success) {
      setError(validation.error.format().email?._errors[0] || 'Correo inválido');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess(true);
      setEmail('');
    }, 1000);
  };

  return (
    <AuthShell
      title="Recuperar acceso"
      subtitle="Te enviaremos instrucciones a tu correo para restablecer la contraseña."
    >
      {success ? (
        <div className="space-y-5">
          <div className="rounded-xl bg-emerald-500/10 px-4 py-3 text-sm font-medium text-emerald-700">
            Correo enviado. Revisa tu bandeja de entrada.
          </div>
          <Link
            href="/auth/login"
            className="text-primary inline-flex text-sm font-semibold hover:underline"
          >
            Volver al inicio de sesión
          </Link>
        </div>
      ) : (
        <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Correo</Label>
            <Input
              id="email"
              type="email"
              placeholder="tu@empresa.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11"
              aria-invalid={!!error}
            />
            {error && <p className="text-xs font-medium text-rose-600">{error}</p>}
          </div>
          <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
            {loading ? 'Enviando...' : 'Enviar instrucciones'}
          </Button>
          <p className="text-muted-foreground text-center text-sm">
            ¿Ya la recordaste?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Iniciar sesión
            </Link>
          </p>
        </form>
      )}
    </AuthShell>
  );
}

export default ForgotPasswordForm;
