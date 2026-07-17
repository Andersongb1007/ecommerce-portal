import type { Metadata } from 'next';
import { CatalogGate } from '@/components/catalog/CatalogGate';
import { CompanyCatalogPanel } from '@/components/catalog/CompanyCatalogPanel';
import { serverApiRequest } from '@/lib/api/serverClient';
import { portalPaths } from '@/lib/api/portal-paths';
import {
  buildListQuery,
  normalizePaginated,
  parseListQuery,
  type PaginatedResponse,
} from '@/lib/api/pagination';
import { canManageCatalog, type PortalCompany } from '@/lib/auth/company-status';
import { type CatalogProduct, type StorefrontData } from '@/lib/validation/catalog';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Vitrina | Portal Empresa',
  description: 'Configura la vitrina pública de tu comercio.',
};

export default async function StorefrontPage() {
  let company: PortalCompany | null = null;
  try {
    company = await serverApiRequest<PortalCompany>(portalPaths.companies.me);
  } catch (err) {
    logger.error({ msg: 'Error cargando perfil en /storefront', err });
  }

  let initialPaginated: PaginatedResponse<CatalogProduct> = {
    data: [],
    meta: {
      total: 0,
      page: 1,
      limit: 50,
      totalPages: 1,
      hasNextPage: false,
      hasPreviousPage: false,
    },
  };
  let initialStorefront: StorefrontData | null = null;

  if (company && canManageCatalog(company)) {
    try {
      const [productsRaw, storefront] = await Promise.all([
        serverApiRequest(
          buildListQuery(
            portalPaths.catalog.companyProducts(company.id),
            parseListQuery({ limit: '50' })
          )
        ),
        serverApiRequest<StorefrontData>(portalPaths.storefront.byCompanyId(company.id)),
      ]);
      initialPaginated = normalizePaginated<CatalogProduct>(
        productsRaw as PaginatedResponse<CatalogProduct>
      );
      initialStorefront = storefront;
    } catch (err) {
      logger.error({ msg: 'Error SSR vitrina portal', err });
    }
  }

  return (
    <CatalogGate
      title="Vitrina"
      company={company}
      emptyMessage="Registra tu empresa para configurar la vitrina pública."
    >
      {company ? (
        <CompanyCatalogPanel
          companyId={company.id}
          companyName={company.name ?? 'Mi empresa'}
          section="storefront"
          initialPaginated={initialPaginated}
          initialStorefront={initialStorefront}
        />
      ) : null}
    </CatalogGate>
  );
}
