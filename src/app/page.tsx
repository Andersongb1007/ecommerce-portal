import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Building2, Package, Store, Settings } from 'lucide-react';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { MetricCard } from '@/components/dashboard/MetricCard';
import { serverApiRequest } from '@/lib/api/serverClient';
import { portalPaths, withPagination } from '@/lib/api/portal-paths';
import { getPrimaryCompany, getPrimaryCompanyId, isCompanyOwner } from '@/lib/auth/company';
import type { User } from '@/context/SessionContext';
import { logger } from '@/lib/logger';
import type { CatalogProduct, StorefrontData } from '@/lib/validation/catalog';
import { normalizePaginated, type PaginatedResponse } from '@/lib/api/pagination';

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
      // Ignorar error de parsing
    }
  }

  // Si la cookie no trae empresas, refrescar perfil desde la API
  if (user && !getPrimaryCompanyId(user)) {
    try {
      user = await serverApiRequest<User>(portalPaths.users.me);
    } catch (err) {
      logger.error({ msg: 'No se pudo cargar el perfil del portal', err });
    }
  }

  const company = getPrimaryCompany(user);
  const companyId = company?.id ?? null;
  const owner = isCompanyOwner(user);

  let productsCount = 0;
  let storefront: StorefrontData | null = null;

  if (companyId) {
    try {
      const [productsRaw, storefrontRaw] = await Promise.all([
        serverApiRequest(
          withPagination(portalPaths.catalog.companyProducts(companyId), 1, 1)
        ),
        serverApiRequest<StorefrontData>(portalPaths.storefront.byCompanyId(companyId)),
      ]);
      productsCount = normalizePaginated<CatalogProduct>(
        productsRaw as PaginatedResponse<CatalogProduct>
      ).meta.total;
      storefront = storefrontRaw;
    } catch (err) {
      logger.error({ msg: 'Error en SSR del dashboard portal', err });
    }
  }

  const todos = [
    {
      title: 'Completar datos de la empresa',
      href: '/company',
      done: Boolean(company?.name && company?.slug),
      icon: Building2,
    },
    {
      title: 'Configurar vitrina (logo, banner, tema)',
      href: '/storefront',
      done: Boolean(storefront?.themeColor || storefront?.bioDescription),
      icon: Store,
    },
    {
      title: 'Publicar productos en el catálogo',
      href: '/products',
      done: productsCount > 0,
      icon: Package,
    },
    {
      title: 'Revisar perfil y seguridad',
      href: '/settings',
      done: Boolean(user?.phoneNumber),
      icon: Settings,
    },
  ];

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <Sidebar />

      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 lg:px-12">
        <header className="mb-8">
          <h1 className="text-foreground text-3xl font-bold tracking-tight">
            {company?.name ? `Hola, ${company.name}` : 'Portal de tu empresa'}
          </h1>
          <p className="text-muted-foreground text-sm">
            Registra tu comercio, completa los datos y publica tus productos.
          </p>
        </header>

        {!owner || !companyId ? (
          <section className="border-border bg-card max-w-xl rounded-lg border p-6 shadow-sm">
            <h2 className="mb-2 text-lg font-semibold">Aún no tienes una empresa</h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Crea tu cuenta de comercio para gestionar catálogo y vitrina. Si ya te registraste,
              espera la aprobación o vuelve a iniciar sesión.
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
                title="Productos"
                value={String(productsCount)}
                description="en tu catálogo"
                icon={Package}
              />
              <MetricCard
                title="Vitrina"
                value={storefront?.isPublished === 2 ? 'Publicada' : 'Borrador'}
                description={storefront?.displayTemplate ?? 'sin plantilla'}
                icon={Store}
              />
              <MetricCard
                title="Slug"
                value={company?.slug ?? '—'}
                description="URL pública de tu tienda"
                icon={Building2}
              />
            </section>

            <section className="bg-card text-card-foreground rounded-lg border p-6 shadow-sm">
              <h2 className="mb-1 text-xl font-semibold tracking-tight">Pendientes</h2>
              <p className="text-muted-foreground mb-4 text-sm">
                Completa estos pasos para dejar tu tienda lista.
              </p>
              <ul className="space-y-3">
                {todos.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.href}>
                      <Link
                        href={item.href}
                        className="hover:bg-muted/50 flex items-center gap-3 rounded-lg border px-4 py-3 transition-colors"
                      >
                        <Icon className="text-primary h-5 w-5 shrink-0" />
                        <span className="flex-1 text-sm font-medium">{item.title}</span>
                        <span
                          className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                            item.done
                              ? 'bg-emerald-500/10 text-emerald-600'
                              : 'bg-amber-500/10 text-amber-600'
                          }`}
                        >
                          {item.done ? 'Listo' : 'TODO'}
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
