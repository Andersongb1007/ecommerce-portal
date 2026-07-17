'use client';

import { useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { companyOnboardingSchema } from '@/lib/validation/auth';
import { browserApiRequest } from '@/lib/api/browserClient';
import { portalPaths } from '@/lib/api/portal-paths';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { CedulaInput } from '@/components/forms/CedulaInput';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { FormattedTextarea, normalizeRichHtml } from '@/components/forms/FormattedTextarea';
import { SlugPreview } from '@/components/forms/SlugPreview';
import type { PortalCompany } from '@/lib/auth/company-status';

interface OnboardingFormProps {
  initialCompany: PortalCompany | null;
}

export function OnboardingForm({ initialCompany }: OnboardingFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [generalError, setGeneralError] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    cedula: '',
    phoneNumber: '',
    name: initialCompany?.name?.startsWith('Empresa ') ? '' : (initialCompany?.name ?? ''),
    address: '',
    bioDescription: '',
    themeColor: '#0B3D3A',
  });

  const setField = (key: keyof typeof form, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setGeneralError('');
    setFieldErrors({});

    const payload = {
      ...form,
      bioDescription: normalizeRichHtml(form.bioDescription),
    };

    const validation = companyOnboardingSchema.safeParse(payload);
    if (!validation.success) {
      const next: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      setGeneralError(Object.values(next)[0] ?? 'Revisa los campos marcados e inténtalo de nuevo');
      return;
    }

    const data = validation.data;
    const body = {
      firstName: data.firstName,
      lastName: data.lastName,
      cedula: data.cedula,
      phoneNumber: data.phoneNumber,
      name: data.name,
      address: data.address,
      themeColor: data.themeColor,
      ...(data.bioDescription ? { bioDescription: data.bioDescription } : {}),
    };

    setLoading(true);
    try {
      await browserApiRequest(portalPaths.companies.meOnboarding, {
        method: 'PATCH',
        body: JSON.stringify(body),
      });
      router.push('/');
      router.refresh();
    } catch (err: unknown) {
      setGeneralError(err instanceof Error ? err.message : 'No se pudo guardar');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="min-w-0 flex-1 overflow-x-hidden overflow-y-auto">
        <div className="mx-auto w-full max-w-xl px-4 py-6 sm:px-6 sm:py-8 lg:max-w-2xl lg:px-8">
          <header className="auth-fade-up mb-6 sm:mb-8">
            <p className="text-primary text-sm font-semibold tracking-wide uppercase">
              Paso 2 de 2
            </p>
            <h1 className="font-display text-foreground mt-1 text-2xl font-semibold tracking-tight sm:text-3xl">
              Completa tu empresa
            </h1>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Con estos datos un administrador podrá revisar y aprobar tu cuenta.
              {initialCompany?.rif ? ` RIF registrado: ${initialCompany.rif}` : ''}
            </p>
          </header>

          <form
            onSubmit={(e) => void handleSubmit(e)}
            className="auth-fade-up auth-delay-1 w-full min-w-0 space-y-6 sm:space-y-8"
          >
            {generalError && (
              <div className="rounded-xl bg-rose-500/10 px-3 py-2.5 text-sm font-medium text-rose-600">
                {generalError}
              </div>
            )}

            <section className="space-y-4">
              <h2 className="font-display text-lg font-semibold">Titular</h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    className="h-11 w-full"
                    value={form.firstName}
                    onChange={(e) => setField('firstName', e.target.value)}
                  />
                  {fieldErrors.firstName && (
                    <p className="text-xs font-medium text-rose-600">{fieldErrors.firstName}</p>
                  )}
                </div>
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    className="h-11 w-full"
                    value={form.lastName}
                    onChange={(e) => setField('lastName', e.target.value)}
                  />
                  {fieldErrors.lastName && (
                    <p className="text-xs font-medium text-rose-600">{fieldErrors.lastName}</p>
                  )}
                </div>
                <div className="min-w-0 sm:col-span-2">
                  <CedulaInput
                    id="cedula"
                    required
                    value={form.cedula}
                    onChange={(cedula) => setField('cedula', cedula)}
                    error={fieldErrors.cedula}
                  />
                </div>
                <div className="min-w-0 sm:col-span-2">
                  <PhoneInput
                    id="phoneNumber"
                    required
                    value={form.phoneNumber}
                    onChange={(phoneNumber) => setField('phoneNumber', phoneNumber)}
                    error={fieldErrors.phoneNumber}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4 border-t pt-6 sm:pt-8">
              <h2 className="font-display text-lg font-semibold">Comercio</h2>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="min-w-0 space-y-2">
                  <Label htmlFor="name">Nombre comercial</Label>
                  <Input
                    id="name"
                    className="h-11 w-full"
                    placeholder="Como aparece en el RIF"
                    value={form.name}
                    onChange={(e) => setField('name', e.target.value)}
                  />
                  {fieldErrors.name ? (
                    <p className="text-xs font-medium text-rose-600">{fieldErrors.name}</p>
                  ) : (
                    <p className="text-muted-foreground text-xs">
                      Usa el mismo nombre legal del RIF para facilitar la validación.
                    </p>
                  )}
                </div>
                <div className="min-w-0">
                  <SlugPreview name={form.name} />
                </div>
              </div>

              <div className="min-w-0">
                <FormattedTextarea
                  id="address"
                  label="Dirección"
                  required
                  formatting={false}
                  maxLength={200}
                  rows={3}
                  placeholder="Av. Principal, Edificio, Ciudad"
                  value={form.address}
                  onChange={(address) => setField('address', address)}
                  error={fieldErrors.address}
                />
              </div>

              <div className="min-w-0">
                <FormattedTextarea
                  id="bioDescription"
                  label="Descripción corta"
                  maxLength={2000}
                  rows={4}
                  placeholder="Breve reseña de tu comercio"
                  value={form.bioDescription}
                  onChange={(bioDescription) => setField('bioDescription', bioDescription)}
                  hint="TipTap (MIT): títulos, listas, tablas… Sin imágenes."
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="themeColor">Color de marca</Label>
                <div className="flex max-w-xs items-center gap-3">
                  <Input
                    id="themeColor"
                    type="color"
                    className="h-11 w-14 shrink-0 cursor-pointer p-1"
                    value={form.themeColor}
                    onChange={(e) => setField('themeColor', e.target.value)}
                  />
                  <Input
                    aria-label="Código hexadecimal del color"
                    className="h-11 min-w-0 flex-1 font-mono text-sm uppercase"
                    value={form.themeColor}
                    maxLength={7}
                    onChange={(e) => {
                      const next = e.target.value.startsWith('#')
                        ? e.target.value
                        : `#${e.target.value}`;
                      setField('themeColor', next.slice(0, 7));
                    }}
                  />
                </div>
              </div>
            </section>

            <div className="pt-2">
              <Button
                type="submit"
                className="h-11 w-full text-base sm:w-auto sm:min-w-[220px]"
                disabled={loading}
              >
                {loading ? 'Guardando...' : 'Guardar y enviar a revisión'}
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
