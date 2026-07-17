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
import { type CatalogBrand } from '@/lib/validation/catalog';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Marcas | Portal Empresa',
  description: 'Gestiona las marcas de tu catálogo retail.',
};

export default async function BrandsPage() {
  let company: PortalCompany | null = null;
  try {
    company = await serverApiRequest<PortalCompany>(portalPaths.companies.me);
  } catch (err) {
    logger.error({ msg: 'Error cargando perfil en /brands', err });
  }

  let initialBrands: CatalogBrand[] = [];
  if (company && canManageCatalog(company)) {
    try {
      const brandsRaw = await serverApiRequest(
        buildListQuery(
          portalPaths.catalog.companyBrands(company.id),
          parseListQuery({ limit: '50' })
        )
      );
      initialBrands = normalizePaginated<CatalogBrand>(
        brandsRaw as PaginatedResponse<CatalogBrand>
      ).data;
    } catch (err) {
      logger.error({ msg: 'Error SSR marcas portal', err });
    }
  }

  return (
    <CatalogGate
      title="Marcas"
      company={company}
      emptyMessage="Necesitas una empresa asociada para gestionar marcas."
    >
      {company ? (
        <CompanyCatalogPanel
          companyId={company.id}
          companyName={company.name ?? 'Mi empresa'}
          section="brands"
          initialBrands={initialBrands}
        />
      ) : null}
    </CatalogGate>
  );
}
