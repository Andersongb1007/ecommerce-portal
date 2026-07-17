'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { companyRegisterSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AuthShell } from '@/components/auth/AuthShell';
import { RifInput } from '@/components/forms/RifInput';
import { useSession, type User } from '@/context/SessionContext';
import { Eye, EyeOff, FileUp } from 'lucide-react';
import { validateRif } from '@/lib/validation/venezuela-id';

export function RegisterForm() {
  const router = useRouter();
  const { login } = useSession();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rifDocument, setRifDocument] = useState<File | null>(null);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rif, setRif] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    const validation = companyRegisterSchema.safeParse({
      accountType: 2,
      email,
      password,
      rif,
    });
    if (!validation.success) {
      const next: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    if (!rifDocument) {
      setFieldErrors({ rifDocument: 'Adjunta el documento RIF' });
      return;
    }

    const rifCheck = validateRif(validation.data.rif);
    if (!rifCheck.valid) {
      setFieldErrors({ rif: rifCheck.message });
      return;
    }

    setLoading(true);
    try {
      const body = new FormData();
      body.append('accountType', '2');
      body.append('email', validation.data.email);
      body.append('password', validation.data.password);
      body.append('rif', validation.data.rif);
      body.append('rifDocument', rifDocument);

      const response = await fetch('/api/auth/register', {
        method: 'POST',
        body,
      });
      const data = (await response.json()) as {
        user?: User;
        error?: { message?: string };
        message?: string;
      };

      if (!response.ok) {
        throw new Error(data?.error?.message || data?.message || 'No se pudo registrar');
      }

      if (data.user) {
        login(data.user);
      }
      router.push('/onboarding');
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title="Registra tu empresa"
      subtitle="Solo correo, contraseña, RIF y el documento. El resto lo completas después."
    >
      <form onSubmit={(e) => void handleSubmit(e)} className="space-y-5">
        {generalError && (
          <div className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-600">
            {generalError}
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
            autoComplete="email"
          />
          {fieldErrors.email && (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.email}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="password">Contraseña</Label>
          <div className="relative">
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pr-10"
              autoComplete="new-password"
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
              onClick={() => setShowPassword((v) => !v)}
              aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {fieldErrors.password && (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.password}</p>
          )}
        </div>

        <RifInput
          id="rif"
          label="RIF de la empresa"
          required
          value={rif}
          onChange={setRif}
          error={fieldErrors.rif}
        />

        <div className="space-y-2">
          <Label htmlFor="rifDocument">Documento RIF</Label>
          <label
            htmlFor="rifDocument"
            className="border-input bg-card hover:border-primary/40 flex cursor-pointer items-center gap-3 rounded-xl border border-dashed px-4 py-3 transition-colors"
          >
            <FileUp className="text-primary h-5 w-5 shrink-0" />
            <span className="text-muted-foreground truncate text-sm">
              {rifDocument ? rifDocument.name : 'PDF o imagen (PNG, JPG, WEBP)'}
            </span>
          </label>
          <Input
            id="rifDocument"
            type="file"
            accept=".pdf,image/png,image/jpeg,image/webp"
            className="sr-only"
            onChange={(e) => setRifDocument(e.target.files?.[0] ?? null)}
          />
          {fieldErrors.rifDocument && (
            <p className="text-xs font-medium text-rose-600">{fieldErrors.rifDocument}</p>
          )}
        </div>

        <Button type="submit" className="h-11 w-full text-base" disabled={loading}>
          {loading ? 'Creando cuenta...' : 'Crear cuenta'}
        </Button>

        <p className="text-muted-foreground text-center text-sm">
          ¿Ya tienes cuenta?{' '}
          <Link href="/auth/login" className="text-primary font-semibold hover:underline">
            Iniciar sesión
          </Link>
        </p>
      </form>
    </AuthShell>
  );
}

export default RegisterForm;
