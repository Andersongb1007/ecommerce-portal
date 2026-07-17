'use client';

import { useState, type FormEvent } from 'react';
import Link from 'next/link';
import { forgotPasswordSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';

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
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Card className="border-border bg-card/60 w-full max-w-md border shadow-lg backdrop-blur-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            Recuperar Contraseña
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Ingresa tu correo electrónico y te enviaremos las instrucciones para restablecer tu
            contraseña
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div
              className="rounded-lg bg-emerald-500/10 p-4 text-center text-sm font-medium text-emerald-500"
              role="alert"
            >
              ¡Correo enviado! Revisa tu bandeja de entrada para continuar.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">Correo Electrónico</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  aria-invalid={!!error}
                  aria-describedby={error ? 'email-error' : undefined}
                  className={error ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
                />
                {error && (
                  <p id="email-error" className="text-xs font-semibold text-rose-500" role="alert">
                    {error}
                  </p>
                )}
              </div>
              <Button type="submit" className="mt-2 w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar Instrucciones'}
              </Button>
            </form>
          )}
        </CardContent>
        <CardFooter className="flex flex-col space-y-2 border-t pt-4">
          <p className="text-muted-foreground text-center text-sm">
            ¿Recordaste tu contraseña?{' '}
            <Link href="/auth/login" className="text-primary font-semibold hover:underline">
              Inicia sesión
            </Link>
          </p>
        </CardFooter>
      </Card>
    </div>
  );
}
export default ForgotPasswordForm;
