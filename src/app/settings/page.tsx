import type { Metadata } from 'next';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { SettingsForm } from '@/components/settings/SettingsForm';
import { portalPaths } from '@/lib/api/portal-paths';
import { serverApiRequest } from '@/lib/api/serverClient';
import type { AdminUserView } from '@/lib/settings/user-session';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Ajustes | Portal Empresa',
  description: 'Perfil y seguridad de tu cuenta de comercio.',
};

export default async function SettingsPage() {
  let initialProfile: AdminUserView | null = null;

  try {
    initialProfile = await serverApiRequest<AdminUserView>(portalPaths.users.me);
  } catch (err) {
    logger.error({ msg: 'Error en SSR al cargar ajustes del portal', err });
  }

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 lg:px-12">
        <header className="mb-8">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Ajustes</h1>
          <p className="text-muted-foreground text-sm">
            Gestiona tu perfil personal y la seguridad de acceso al portal.
          </p>
        </header>

        <section className="space-y-6">
          <SettingsForm initialProfile={initialProfile} />
        </section>
      </main>
    </div>
  );
}
