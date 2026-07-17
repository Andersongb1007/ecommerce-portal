import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { serverApiRequest } from '@/lib/api/serverClient';
import { portalPaths } from '@/lib/api/portal-paths';
import { getPrimaryCompany, getPrimaryCompanyId } from '@/lib/auth/company';
import type { User } from '@/context/SessionContext';
import type { StorefrontData } from '@/lib/validation/catalog';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi empresa | Portal Empresa',
  description: 'Datos principales de tu comercio.',
};

export default async function CompanyPage() {
  const cookieStore = await cookies();
  let user: User | null = null;
  const raw = cookieStore.get('userSession')?.value;
  if (raw) {
    try {
      user = JSON.parse(decodeURIComponent(raw)) as User;
    } catch {
      // ignore
    }
  }

  if (user && !getPrimaryCompanyId(user)) {
    try {
      user = await serverApiRequest<User>(portalPaths.users.me);
    } catch (err) {
      logger.error({ msg: 'Error cargando perfil en /company', err });
    }
  }

  const company = getPrimaryCompany(user);
  let storefront: StorefrontData | null = null;
  if (company?.id) {
    try {
      storefront = await serverApiRequest<StorefrontData>(
        portalPaths.storefront.byCompanyId(company.id)
      );
    } catch (err) {
      logger.error({ msg: 'Error cargando storefront en /company', err });
    }
  }

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 lg:px-12">
        <header className="mb-8">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">Mi empresa</h1>
          <p className="text-muted-foreground text-sm">
            Revisa los datos de tu comercio. La edición avanzada de vitrina está en Vitrina.
          </p>
        </header>

        {!company ? (
          <div className="bg-card max-w-lg rounded-lg border p-6">
            <p className="text-muted-foreground mb-4 text-sm">
              Todavía no hay una empresa asociada a tu cuenta.
            </p>
            <Link
              href="/auth/register"
              className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
            >
              Registrar empresa
            </Link>
          </div>
        ) : (
          <section className="bg-card max-w-2xl space-y-4 rounded-lg border p-6 shadow-sm">
            <dl className="grid gap-4 sm:grid-cols-2">
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase">Nombre</dt>
                <dd className="text-sm font-semibold">{company.name ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase">Slug</dt>
                <dd className="text-sm font-semibold">{company.slug ?? '—'}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase">Estado</dt>
                <dd className="text-sm font-semibold">
                  {company.status === 2
                    ? 'Activa'
                    : company.status === 1
                      ? 'Pendiente'
                      : `Código ${company.status ?? '—'}`}
                </dd>
              </div>
              <div>
                <dt className="text-muted-foreground text-xs font-medium uppercase">Plantilla</dt>
                <dd className="text-sm font-semibold">{storefront?.displayTemplate ?? '—'}</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-muted-foreground text-xs font-medium uppercase">Bio</dt>
                <dd className="text-sm">{storefront?.bioDescription || 'Sin descripción'}</dd>
              </div>
            </dl>
            <div className="flex flex-wrap gap-2 pt-2">
              <Link
                href="/storefront"
                className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
              >
                Editar vitrina
              </Link>
              <Link
                href="/products"
                className="border-border hover:bg-muted inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium"
              >
                Gestionar productos
              </Link>
            </div>
            <p className="text-muted-foreground text-xs">
              TODO: formulario de edición de datos fiscales y redes sociales cuando el API lo
              exponga para OWNER.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
