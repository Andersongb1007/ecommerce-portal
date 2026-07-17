'use client';

import { Suspense, useEffect, useState, type FormEvent } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { loginSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { useSession } from '@/context/SessionContext';
import { Eye, EyeOff } from 'lucide-react';

export function LoginForm() {
  return (
    <Suspense fallback={<LoginFormFallback />}>
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormFallback() {
  return (
    <div className="bg-background text-foreground flex min-h-screen items-center justify-center p-6">
      <p className="text-muted-foreground text-sm">Cargando...</p>
    </div>
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
  const sessionExpiredMessage = isSessionExpired
    ? 'Tu sesión expiró. Inicia sesión de nuevo para continuar.'
    : '';
  const displayError = generalError || sessionExpiredMessage;

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const responseData = await response.json();

      if (!response.ok) {
        throw new Error(
          responseData?.error?.message || 'Credenciales inválidas o error en el servidor'
        );
      }

      login(responseData.user);

      const params = new URLSearchParams(window.location.search);
      const redirectUrl = params.get('redirect') || '/';

      router.push(redirectUrl);
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Ocurrió un error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-6">
      {/* Selector de tema flotante */}
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Card className="border-border bg-card/60 w-full max-w-md border shadow-lg backdrop-blur-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Accede al portal de tu empresa para gestionar productos y vitrina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {displayError && (
              <div
                className="rounded-lg bg-rose-500/10 p-3 text-sm font-medium text-rose-500"
                role="alert"
              >
                {displayError}
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Correo Electrónico</Label>
              <Input
                id="email"
                type="email"
                placeholder="ejemplo@correo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? 'email-error' : undefined}
                className={errors.email ? 'border-rose-500 focus-visible:ring-rose-500' : ''}
              />
              {errors.email && (
                <p id="email-error" className="text-xs font-semibold text-rose-500" role="alert">
                  {errors.email}
                </p>
              )}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
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
                  aria-invalid={!!errors.password}
                  aria-describedby={errors.password ? 'password-error' : undefined}
                  className={`pr-10 ${errors.password ? 'border-rose-500 focus-visible:ring-rose-500' : ''}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-muted-foreground hover:text-foreground focus-visible:ring-ring absolute top-1/2 right-3 -translate-y-1/2 rounded transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
                  aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {errors.password && (
                <p id="password-error" className="text-xs font-semibold text-rose-500" role="alert">
                  {errors.password}
                </p>
              )}
            </div>
            <Button type="submit" className="mt-2 w-full" disabled={loading}>
              {loading ? 'Iniciando sesión...' : 'Ingresar'}
            </Button>
            <p className="text-muted-foreground text-center text-sm">
              ¿Eres un comercio nuevo?{' '}
              <Link href="/auth/register" className="text-primary font-medium hover:underline">
                Registra tu empresa
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
export default LoginForm;
