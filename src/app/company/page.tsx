import type { Metadata } from 'next';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { RichTextContent } from '@/components/forms/RichTextContent';
import { serverApiRequest } from '@/lib/api/serverClient';
import { portalPaths } from '@/lib/api/portal-paths';
import {
  canManageCatalog,
  getCompanyLifecycleLabel,
  isCompanyOnboardingComplete,
  type PortalCompany,
} from '@/lib/auth/company-status';
import { resolveFileIdUrl, resolveMediaUrl } from '@/lib/media/url';
import {
  DISPLAY_TEMPLATE_LABELS,
  STOREFRONT_PUBLISHED,
  type StorefrontData,
} from '@/lib/validation/catalog';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Mi empresa | Portal Empresa',
  description: 'Datos principales de tu comercio.',
};

export default async function CompanyPage() {
  let company: PortalCompany | null = null;
  let storefront: StorefrontData | null = null;
  try {
    company = await serverApiRequest<PortalCompany>(portalPaths.companies.me);
  } catch (err) {
    logger.error({ msg: 'Error cargando empresa en /company', err });
  }

  if (company && canManageCatalog(company)) {
    try {
      storefront = await serverApiRequest<StorefrontData>(
        portalPaths.storefront.byCompanyId(company.id)
      );
    } catch (err) {
      logger.error({ msg: 'Error cargando vitrina en /company', err });
    }
  }

  const logoUrl = resolveMediaUrl(storefront?.logoUrl) || resolveFileIdUrl(company?.logoFile?.id);
  const bannerUrl =
    resolveMediaUrl(storefront?.bannerUrl) || resolveFileIdUrl(company?.bannerFile?.id);
  const theme = storefront?.themeColor || company?.themeColor || '#0B3D3A';
  const bio = storefront?.bioDescription || company?.bioDescription || '';

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 lg:px-10">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-foreground text-3xl font-bold tracking-tight">Mi empresa</h1>
            <p className="text-muted-foreground text-sm">
              Todos tus datos comerciales y el aspecto de la vitrina.
            </p>
          </div>
          {company && canManageCatalog(company) ? (
            <Link
              href="/storefront"
              className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
            >
              Personalizar vitrina
            </Link>
          ) : null}
        </header>

        {!company ? (
          <div className="bg-card rounded-lg border p-6">
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
          <div className="grid gap-6 xl:grid-cols-2">
            <section className="bg-card space-y-4 rounded-xl border p-6 shadow-sm">
              <h2 className="text-base font-semibold">Datos del comercio</h2>
              <dl className="grid gap-4 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs font-medium uppercase">Nombre</dt>
                  <dd className="text-sm font-semibold">{company.name ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium uppercase">Slug</dt>
                  <dd className="text-sm font-semibold">/{company.slug ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium uppercase">RIF</dt>
                  <dd className="text-sm font-semibold">{company.rif ?? '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium uppercase">Estado</dt>
                  <dd className="text-sm font-semibold">{getCompanyLifecycleLabel(company)}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs font-medium uppercase">Teléfono</dt>
                  <dd className="text-sm font-semibold">{company.phoneNumber || '—'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-muted-foreground text-xs font-medium uppercase">Dirección</dt>
                  <dd className="text-sm">{company.address || '—'}</dd>
                </div>
              </dl>

              <h3 className="pt-2 text-sm font-semibold">Redes</h3>
              <dl className="grid gap-3 sm:grid-cols-2">
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Instagram</dt>
                  <dd className="text-sm">{company.instagram || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">Facebook</dt>
                  <dd className="text-sm">{company.facebook || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">X / Twitter</dt>
                  <dd className="text-sm">{company.x || '—'}</dd>
                </div>
                <div>
                  <dt className="text-muted-foreground text-xs uppercase">TikTok</dt>
                  <dd className="text-sm">{company.tiktok || '—'}</dd>
                </div>
              </dl>

              <div className="flex flex-wrap gap-2 pt-2">
                {!isCompanyOnboardingComplete(company) && (
                  <Link
                    href="/onboarding"
                    className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
                  >
                    Completar datos
                  </Link>
                )}
                <Link
                  href="/products"
                  className="border-border hover:bg-muted inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium"
                >
                  Productos
                </Link>
              </div>
            </section>

            <section className="bg-card space-y-4 overflow-hidden rounded-xl border shadow-sm">
              <div className="space-y-1 p-6 pb-0">
                <h2 className="text-base font-semibold">Apariencia de la vitrina</h2>
                <p className="text-muted-foreground text-xs">
                  Plantilla, color, bio, logo y banner. Edítalos en Vitrina.
                </p>
              </div>

              {bannerUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={bannerUrl} alt="" className="h-36 w-full object-cover" />
              ) : (
                <div className="h-28 w-full" style={{ backgroundColor: theme }} />
              )}

              <div className="space-y-4 px-6 pb-6">
                <div className="flex items-end gap-3">
                  {logoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={logoUrl}
                      alt="Logo"
                      className="-mt-10 h-16 w-16 rounded-xl border-4 border-white object-cover shadow"
                    />
                  ) : (
                    <div
                      className="-mt-10 flex h-16 w-16 items-center justify-center rounded-xl border-4 border-white text-lg font-bold text-white shadow"
                      style={{ backgroundColor: theme }}
                    >
                      {(company.name ?? '?').slice(0, 1).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold">{company.name}</p>
                    <p className="text-muted-foreground text-xs">
                      {DISPLAY_TEMPLATE_LABELS[
                        storefront?.displayTemplate ?? company.board?.displayTemplate ?? 'GRID'
                      ] ?? 'Grid'}
                      {' · '}
                      {(storefront?.isPublished ?? company.board?.isPublished) ===
                      STOREFRONT_PUBLISHED
                        ? 'Publicada'
                        : 'Borrador'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 text-sm">
                  <span
                    className="inline-block size-4 rounded-full border"
                    style={{ backgroundColor: theme }}
                  />
                  <span className="font-mono text-xs">{theme}</span>
                </div>

                {bio ? (
                  <RichTextContent html={bio} className="text-muted-foreground" />
                ) : (
                  <p className="text-muted-foreground text-sm italic">Sin bio configurada.</p>
                )}

                {canManageCatalog(company) ? (
                  <Link
                    href="/storefront"
                    className="border-border hover:bg-muted inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium"
                  >
                    Editar vitrina
                  </Link>
                ) : (
                  <p className="text-muted-foreground text-xs">
                    La personalización de vitrina se habilita cuando la empresa esté aprobada.
                  </p>
                )}
              </div>
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
