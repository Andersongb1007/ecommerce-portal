'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth/AuthShell';
import { useSession } from '@/context/SessionContext';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  return (
    <Suspense
      fallback={
        <div className="bg-background flex min-h-screen items-center justify-center p-6">
          <p className="text-muted-foreground text-sm">Cargando...</p>
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login } = useSession();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');

  const isSessionExpired = searchParams.get('error') === 'session_expired';
  const displayError =
    generalError ||
    (isSessionExpired ? 'Tu sesión expiró. Inicia sesión de nuevo para continuar.' : '');

  useEffect(() => {
    if (isSessionExpired) {
      void fetch('/api/auth/logout', { method: 'POST' });
    }
  }, [isSessionExpired]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setErrors({});
    setGeneralError('');

    const validation = loginSchema.safeParse({ email, password });
    if (!validation.success) {
      const formattedErrors = validation.error.format();
      setErrors({
        email: formattedErrors.email?._errors[0],
        password: formattedErrors.password?._errors[0],
      });
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData?.error?.message || 'Credenciales inválidas o error en el servidor'
        );
      }

      login(responseData.user);
      const redirectUrl = new URLSearchParams(window.location.search).get('redirect') || '/';
      router.push(redirectUrl);
      router.refresh();
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Bienvenido de nuevo"
      subtitle="Accede para gestionar tu empresa, productos y vitrina."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {displayError && (
          <div className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-600">
            {displayError}
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Correo</Label>
          <Input
            id="email"
            type="email"
            placeholder="tu@empresa.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11"
            aria-invalid={!!errors.email}
          />
          {errors.email && <p className="text-xs font-medium text-rose-600">{errors.email}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor="password">Contraseña</Label>
            <Link
              href="/auth/forgot-password"
              className="text-primary text-xs font-medium hover:underline"
            >
              ¿Olvidaste tu contraseña?
            </Link>
          </div>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10"
              aria-invalid={!!errors.password}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {errors.password && (
            <p className="text-xs font-medium text-rose-600">{errors.password}</p>
          )}
        </div>

        <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
          {loading ? 'Ingresando...' : 'Ingresar'}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          ¿Comercio nuevo?{' '}
          <Link href="/auth/register" className="text-primary font-semibold hover:underline">
            Crear cuenta
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default LoginForm;
