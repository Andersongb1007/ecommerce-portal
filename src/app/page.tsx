import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Building2, Package, Store, Settings } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { serverApiRequest } from '@/lib/api/serverClient';
import { portalPaths, withPagination } from '@/lib/api/portal-paths';
import type { User } from '@/context/SessionContext';
import { logger } from '@/lib/logger';
import type { CatalogProduct, StorefrontData } from '@/lib/validation/catalog';
import { normalizePaginated, type PaginatedResponse } from '@/lib/api/pagination';
import {
  canManageCatalog,
  getCompanyLifecycleLabel,
  isCompanyOnboardingComplete,
  type PortalCompany,
  CompanyStatus,
} from '@/lib/auth/company-status';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Inicio | Portal Empresa',
  description: 'Panel del comercio para gestionar empresa, vitrina y productos.',
};

export default async function DashboardPage() {
  const cookieStore = await cookies();
  const userSession = cookieStore.get('userSession')?.value;
  let user: User | null = null;
  if (userSession) {
    try {
      user = JSON.parse(decodeURIComponent(userSession)) as User;
    } catch {
      // Ignorar
    }
  }

  let company: PortalCompany | null = null;
  try {
    company = await serverApiRequest<PortalCompany>(portalPaths.companies.me);
  } catch (err) {
    logger.error({ msg: 'No se pudo cargar la empresa del portal', err });
  }

  let productsCount = 0;
  let storefront: StorefrontData | null = null;
  const catalogAllowed = canManageCatalog(company);

  if (company?.id && catalogAllowed) {
    try {
      const [productsRaw, storefrontRaw] = await Promise.all([
        serverApiRequest(withPagination(portalPaths.catalog.companyProducts(company.id), 1, 1)),
        serverApiRequest<StorefrontData>(portalPaths.storefront.byCompanyId(company.id)),
      ]);
      productsCount = normalizePaginated<CatalogProduct>(
        productsRaw as PaginatedResponse<CatalogProduct>
      ).meta.total;
      storefront = storefrontRaw;
    } catch (err) {
      logger.error({ msg: 'Error en SSR del dashboard portal', err });
    }
  }

  const lifecycle = getCompanyLifecycleLabel(company);
  const todos = [
    {
      title: 'Completar datos de la empresa',
      href: '/onboarding',
      done: isCompanyOnboardingComplete(company),
      icon: Building2,
    },
    {
      title: 'Esperar aprobación del administrador',
      href: '/company',
      done: company?.status === CompanyStatus.ACTIVE,
      icon: Settings,
    },
    {
      title: 'Configurar vitrina',
      href: '/storefront',
      done: Boolean(storefront?.themeColor || storefront?.bioDescription),
      icon: Store,
      locked: !catalogAllowed,
    },
    {
      title: 'Publicar productos',
      href: '/products',
      done: productsCount > 0,
      icon: Package,
      locked: !catalogAllowed,
    },
  ];

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 lg:px-12">
        <header className="mb-8">
          <h1 className="font-display text-foreground text-3xl font-semibold tracking-tight">
            {company?.name && isCompanyOnboardingComplete(company)
              ? `Hola, ${company.name}`
              : 'Portal de tu empresa'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Estado: <span className="font-medium">{lifecycle}</span>
            {user?.email ? ` · ${user.email}` : ''}
          </p>
        </header>

        {!company ? (
          <section className="border-border bg-card max-w-xl rounded-lg border p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Aún no tienes una empresa</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Registra tu comercio con correo, contraseña y RIF para comenzar.
            </p>
            <Link
              href="/auth/register"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-9 items-center justify-center rounded-md px-4 text-sm font-medium"
            >
              Registrar mi empresa
            </Link>
          </section>
        ) : (
          <>
            <section
              className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
              aria-label="Resumen del comercio"
            >
              <MetricCard
                title="Estado"
                value={lifecycle}
                description={company.rif ?? 'sin RIF'}
                icon={Building2}
              />
              <MetricCard
                title="Productos"
                value={catalogAllowed ? String(productsCount) : '—'}
                description={catalogAllowed ? 'en tu catálogo' : 'disponible tras aprobación'}
                icon={Package}
              />
              <MetricCard
                title="Slug"
                value={isCompanyOnboardingComplete(company) ? (company.slug ?? '—') : 'Pendiente'}
                description="URL pública de tu tienda"
                icon={Store}
              />
            </section>

            {!isCompanyOnboardingComplete(company) && (
              <div className="mb-6 rounded-lg border border-amber-500/30 bg-amber-500/10 p-4 text-sm">
                Completa tus datos para que un administrador pueda revisar y aprobar tu cuenta.{' '}
                <Link href="/onboarding" className="text-primary font-medium underline">
                  Ir al onboarding
                </Link>
              </div>
            )}

            {isCompanyOnboardingComplete(company) && company.status === CompanyStatus.PENDING && (
              <div className="mb-6 rounded-lg border border-sky-500/30 bg-sky-500/10 p-4 text-sm">
                Tus datos están completos. Un administrador debe aprobar tu empresa antes de
                publicar productos.
              </div>
            )}

            <section className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <h2 className="mb-1 text-xl font-semibold tracking-tight">Pendientes</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Pasos para dejar tu tienda lista en el sitio.
              </p>
              <ul className="space-y-3">
                {todos.map((item) => {
                  const Icon = item.icon;
                  const locked = 'locked' in item && item.locked;
                  return (
                    <li key={item.href}>
                      <Link
                        href={locked ? '#' : item.href}
                        aria-disabled={locked}
                        className={`flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors ${
                          locked ? 'cursor-not-allowed opacity-60' : 'hover:bg-muted/50'
                        }`}
                      >
                        <Icon className="text-primary h-5 w-5 shrink-0" />
                        <span className="flex-1 text-sm font-medium">{item.title}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.done
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : locked
                                ? 'bg-muted text-muted-foreground'
                                : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {item.done ? 'Listo' : locked ? 'Bloqueado' : 'TODO'}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </>
        )}
      </main>
    </div>
  );
}
