'use client';

import { useState, type FormEvent } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { User, Shield, Check, Save, Eye, EyeOff } from 'lucide-react';
import { useSession } from '@/context/SessionContext';
import { browserApiRequest } from '@/lib/api/browserClient';
import { portalPaths } from '@/lib/api/portal-paths';
import { changePasswordFormSchema } from '@/lib/validation/auth';
import { z } from 'zod';
import { cedulaSchema, phoneSchema, rifSchema } from '@/lib/validation/business';
import { logger } from '@/lib/logger';
import type { AdminUserView } from '@/lib/settings/user-session';
import { syncUserSession, toSessionUser } from '@/lib/settings/user-session';
import { CedulaInput } from '@/components/forms/CedulaInput';
import { PhoneInput } from '@/components/forms/PhoneInput';
import { RifInput } from '@/components/forms/RifInput';
import { formatPhoneInput } from '@/lib/validation/venezuela-phone';

const portalProfileSchema = z.object({
  firstName: z.string().min(2, { message: 'El nombre debe tener al menos 2 caracteres' }),
  lastName: z.string().min(2, { message: 'El apellido debe tener al menos 2 caracteres' }),
  phoneNumber: phoneSchema,
  cedula: cedulaSchema,
  rif: z.union([rifSchema, z.literal('')]),
});

interface SettingsFormProps {
  initialProfile: AdminUserView | null;
}

function profileFromUser(user: AdminUserView) {
  return {
    firstName: user.firstName,
    lastName: user.lastName,
    email: user.email,
    phoneNumber: formatPhoneInput(user.phoneNumber || ''),
    cedula: user.cedula ?? '',
    rif: user.rif ?? '',
  };
}

export function SettingsForm({ initialProfile }: SettingsFormProps) {
  const { user, login } = useSession();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [profile, setProfile] = useState(() =>
    initialProfile
      ? profileFromUser(initialProfile)
      : {
          firstName: user?.firstName || '',
          lastName: user?.lastName || '',
          email: user?.email || '',
          phoneNumber: user?.phoneNumber || '',
          cedula: user?.cedula || '',
          rif: user?.rif || '',
        }
  );

  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({});
  const [securityErrors, setSecurityErrors] = useState<Record<string, string>>({});

  const [security, setSecurity] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  const [profileLoading, setProfileLoading] = useState(false);
  const [securityLoading, setSecurityLoading] = useState(false);

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  const triggerToast = (msg: string, isError = false) => {
    setToastMessage(msg);
    setToastIsError(isError);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleProfileSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setProfileErrors({});

    const validation = portalProfileSchema.safeParse(profile);
    if (!validation.success) {
      const next: Record<string, string> = {};
      for (const issue of validation.error.issues) {
        const key = String(issue.path[0] ?? 'form');
        if (!next[key]) next[key] = issue.message;
      }
      setProfileErrors(next);
      return;
    }

    setProfileLoading(true);
    try {
      const payload = {
        firstName: validation.data.firstName,
        lastName: validation.data.lastName,
        phoneNumber: validation.data.phoneNumber,
        cedula: validation.data.cedula,
        rif: validation.data.rif || null,
      };
      const updated = await browserApiRequest<AdminUserView>(portalPaths.users.meProfile, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      const sessionUser = toSessionUser(updated, user ?? undefined);
      await syncUserSession(sessionUser);
      login(sessionUser);
      setProfile(profileFromUser(updated));
      triggerToast('Perfil actualizado correctamente');
    } catch (err: unknown) {
      logger.error({ msg: 'Error al guardar perfil', err });
      triggerToast(err instanceof Error ? err.message : 'Error al guardar el perfil', true);
    } finally {
      setProfileLoading(false);
    }
  };

  const handleSecuritySubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSecurityErrors({});

    const validation = changePasswordFormSchema.safeParse(security);
    if (!validation.success) {
      const formatted = validation.error.format();
      setSecurityErrors({
        currentPassword: formatted.currentPassword?._errors[0] || '',
        newPassword: formatted.newPassword?._errors[0] || '',
        confirmPassword: formatted.confirmPassword?._errors[0] || '',
      });
      return;
    }

    setSecurityLoading(true);
    try {
      await browserApiRequest<{ message: string }>(portalPaths.users.mePassword, {
        method: 'PATCH',
        body: JSON.stringify({
          currentPassword: validation.data.currentPassword,
          newPassword: validation.data.newPassword,
        }),
      });

      setSecurity({ currentPassword: '', newPassword: '', confirmPassword: '' });
      triggerToast('Contraseña actualizada correctamente');
    } catch (err: unknown) {
      logger.error({ msg: 'Error al cambiar contraseña', err });
      triggerToast(err instanceof Error ? err.message : 'Error al cambiar la contraseña', true);
    } finally {
      setSecurityLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-muted flex w-fit rounded-lg border p-1 text-sm font-medium">
        <button
          type="button"
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 transition-all ${
            activeTab === 'profile'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="h-4 w-4" />
          Mi Perfil
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 rounded-md px-4 py-2 transition-all ${
            activeTab === 'security'
              ? 'bg-background text-foreground shadow-sm'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Shield className="h-4 w-4" />
          Seguridad
        </button>
      </div>

      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Perfil</CardTitle>
            <CardDescription>Datos personales del titular de la empresa</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleProfileSubmit(e)} className="max-w-xl space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Nombre</Label>
                  <Input
                    id="firstName"
                    value={profile.firstName}
                    onChange={(e) => setProfile((p) => ({ ...p, firstName: e.target.value }))}
                  />
                  {profileErrors.firstName && (
                    <p className="text-xs text-rose-500">{profileErrors.firstName}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Apellido</Label>
                  <Input
                    id="lastName"
                    value={profile.lastName}
                    onChange={(e) => setProfile((p) => ({ ...p, lastName: e.target.value }))}
                  />
                  {profileErrors.lastName && (
                    <p className="text-xs text-rose-500">{profileErrors.lastName}</p>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" value={profile.email} disabled />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <CedulaInput
                  id="cedula"
                  value={profile.cedula}
                  onChange={(cedula) => setProfile((p) => ({ ...p, cedula }))}
                  error={profileErrors.cedula}
                />
                <RifInput
                  id="rif"
                  label="RIF personal"
                  value={profile.rif}
                  onChange={(rif) => setProfile((p) => ({ ...p, rif }))}
                  error={profileErrors.rif}
                />
              </div>
              <PhoneInput
                id="phoneNumber"
                value={profile.phoneNumber}
                onChange={(phoneNumber) => setProfile((p) => ({ ...p, phoneNumber }))}
                error={profileErrors.phoneNumber}
              />
              <Button type="submit" disabled={profileLoading}>
                {profileLoading ? (
                  'Guardando...'
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Guardar perfil
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card>
          <CardHeader>
            <CardTitle>Seguridad</CardTitle>
            <CardDescription>Cambia la contraseña de acceso al portal</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={(e) => void handleSecuritySubmit(e)} className="max-w-xl space-y-4">
              <div className="space-y-2">
                <Label htmlFor="currentPassword">Contraseña actual</Label>
                <div className="relative">
                  <Input
                    id="currentPassword"
                    type={showCurrentPassword ? 'text' : 'password'}
                    value={security.currentPassword}
                    onChange={(e) =>
                      setSecurity((s) => ({ ...s, currentPassword: e.target.value }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowCurrentPassword((v) => !v)}
                  >
                    {showCurrentPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {securityErrors.currentPassword && (
                  <p className="text-xs text-rose-500">{securityErrors.currentPassword}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="newPassword">Nueva contraseña</Label>
                <div className="relative">
                  <Input
                    id="newPassword"
                    type={showNewPassword ? 'text' : 'password'}
                    value={security.newPassword}
                    onChange={(e) => setSecurity((s) => ({ ...s, newPassword: e.target.value }))}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowNewPassword((v) => !v)}
                  >
                    {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {securityErrors.newPassword && (
                  <p className="text-xs text-rose-500">{securityErrors.newPassword}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirmar contraseña</Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    type={showConfirmPassword ? 'text' : 'password'}
                    value={security.confirmPassword}
                    onChange={(e) =>
                      setSecurity((s) => ({ ...s, confirmPassword: e.target.value }))
                    }
                    className="pr-10"
                  />
                  <button
                    type="button"
                    className="text-muted-foreground absolute top-1/2 right-3 -translate-y-1/2"
                    onClick={() => setShowConfirmPassword((v) => !v)}
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </button>
                </div>
                {securityErrors.confirmPassword && (
                  <p className="text-xs text-rose-500">{securityErrors.confirmPassword}</p>
                )}
              </div>
              <Button type="submit" disabled={securityLoading}>
                {securityLoading ? 'Actualizando...' : 'Cambiar contraseña'}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {toastMessage && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-lg px-4 py-3 text-sm font-medium shadow-lg ${
            toastIsError ? 'bg-rose-600 text-white' : 'bg-emerald-600 text-white'
          }`}
        >
          {!toastIsError && <Check className="h-4 w-4" />}
          {toastMessage}
        </div>
      )}
    </div>
  );
}

export default SettingsForm;
