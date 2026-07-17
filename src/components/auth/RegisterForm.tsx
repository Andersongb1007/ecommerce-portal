'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { companyRegisterSchema } from '@/lib/validation/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';
import { useSession, type User } from '@/context/SessionContext';
import { Eye, EyeOff } from 'lucide-react';

export function RegisterForm() {
  const router = useRouter();
  const { login } = useSession();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [rifDocument, setRifDocument] = useState<File | null>(null);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    cedula: '',
    phoneNumber: '',
    name: '',
    slug: '',
    rif: '',
    address: '',
    bioDescription: '',
    themeColor: '#2563eb',
  });

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    const validation = companyRegisterSchema.safeParse({ ...form, accountType: 2 });
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

    setLoading(true);
    try {
      const body = new FormData();
      Object.entries(validation.data).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          body.append(key, String(value));
        }
      });
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
      router.push('/');
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="absolute top-6 right-6">
        <ThemeToggle />
      </div>

      <Card className="border-border bg-card/60 w-full max-w-2xl border shadow-lg backdrop-blur-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-center text-2xl font-bold tracking-tight">
            Registrar mi empresa
          </CardTitle>
          <CardDescription className="text-muted-foreground text-center">
            Crea tu cuenta de comercio para gestionar productos y vitrina
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={(e) => void handleSubmit(e)} className="space-y-6">
            {generalError && (
              <div className="rounded-lg bg-rose-500/10 p-3 text-sm font-medium text-rose-500">
                {generalError}
              </div>
            )}

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Datos del titular</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={form.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-xs text-rose-500">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={form.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs text-rose-500">{fieldErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => setField('email', e.target.value)}
                  />
                  {fieldErrors.email && <p className="text-xs text-rose-500">{fieldErrors.email}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={form.password}
                      onChange={(e) => setField('password', e.target.value)}
                      className="pr-10"
                    />
                    <button
                      type="button"
                      className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                      onClick={() => setShowPassword((v) => !v)}
                      aria-label={showPassword ? 'Ocultar' : 'Mostrar'}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                  {fieldErrors.password && (
                    <p className="text-xs text-rose-500">{fieldErrors.password}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="cedula">Cédula</Label>
                  <Input
                    id="cedula"
                    placeholder="V-12345678"
                    value={form.cedula}
                    onChange={(e) => setField('cedula', e.target.value)}
                  />
                  {fieldErrors.cedula && (
                    <p className="text-xs text-rose-500">{fieldErrors.cedula}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">Teléfono</Label>
                  <Input
                    id="phoneNumber"
                    placeholder="+584121234567"
                    value={form.phoneNumber}
                    onChange={(e) => setField('phoneNumber', e.target.value)}
                  />
                  {fieldErrors.phoneNumber && (
                    <p className="text-xs text-rose-500">{fieldErrors.phoneNumber}</p>
                  )}
                </div>
              </div>
            </fieldset>

            <fieldset className="space-y-3">
              <legend className="text-sm font-semibold">Datos de la empresa</legend>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="name">Nombre comercial</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                  />
                  {fieldErrors.name && <p className="text-xs text-rose-500">{fieldErrors.name}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug (URL)</Label>
                  <Input
                    id="slug"
                    placeholder="mi-tienda"
                    value={form.slug}
                    onChange={(e) => setField('slug', e.target.value.toLowerCase())}
                  />
                  {fieldErrors.slug && <p className="text-xs text-rose-500">{fieldErrors.slug}</p>}
                </div>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="rif">RIF</Label>
                  <Input
                    id="rif"
                    placeholder="J-12345678-9"
                    value={form.rif}
                    onChange={(e) => setField('rif', e.target.value)}
                  />
                  {fieldErrors.rif && <p className="text-xs text-rose-500">{fieldErrors.rif}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="themeColor">Color de marca</Label>
                  <Input
                    id="themeColor"
                    type="color"
                    value={form.themeColor}
                    onChange={(e) => setField('themeColor', e.target.value)}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="address">Dirección</Label>
                <Input
                  id="address"
                  value={form.address}
                  onChange={(e) => setField('address', e.target.value)}
                />
                {fieldErrors.address && (
                  <p className="text-xs text-rose-500">{fieldErrors.address}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="bioDescription">Descripción corta</Label>
                <Input
                  id="bioDescription"
                  maxLength={150}
                  value={form.bioDescription}
                  onChange={(e) => setField('bioDescription', e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="rifDocument">Documento RIF</Label>
                <Input
                  id="rifDocument"
                  type="file"
                  accept=".pdf,image/png,image/jpeg,image/webp"
                  onChange={(e) => setRifDocument(e.target.files?.[0] ?? null)}
                />
                {fieldErrors.rifDocument && (
                  <p className="text-xs text-rose-500">{fieldErrors.rifDocument}</p>
                )}
              </div>
            </fieldset>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Registrando...' : 'Crear cuenta de empresa'}
            </Button>

            <p className="text-muted-foreground text-center text-sm">
              ¿Ya tienes cuenta?{' '}
              <Link href="/auth/login" className="text-primary font-medium hover:underline">
                Iniciar sesión
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

export default RegisterForm;
