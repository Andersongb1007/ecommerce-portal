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
import { type CatalogBrand, type CatalogModel } from '@/lib/validation/catalog';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Modelos | Portal Empresa',
  description: 'Gestiona modelos y líneas de tu catálogo retail.',
};

export default async function ModelsPage() {
  let company: PortalCompany | null = null;
  try {
    company = await serverApiRequest<PortalCompany>(portalPaths.companies.me);
  } catch (err) {
    logger.error({ msg: 'Error cargando perfil en /models', err });
  }

  let initialBrands: CatalogBrand[] = [];
  let initialModels: CatalogModel[] = [];
  if (company && canManageCatalog(company)) {
    try {
      const [brandsRaw, modelsRaw] = await Promise.all([
        serverApiRequest(
          buildListQuery(
            portalPaths.catalog.companyBrands(company.id),
            parseListQuery({ limit: '50' })
          )
        ),
        serverApiRequest(
          buildListQuery(
            portalPaths.catalog.companyModels(company.id),
            parseListQuery({ limit: '50' })
          )
        ),
      ]);
      initialBrands = normalizePaginated<CatalogBrand>(
        brandsRaw as PaginatedResponse<CatalogBrand>
      ).data;
      initialModels = normalizePaginated<CatalogModel>(
        modelsRaw as PaginatedResponse<CatalogModel>
      ).data;
    } catch (err) {
      logger.error({ msg: 'Error SSR modelos portal', err });
    }
  }

  return (
    <CatalogGate
      title="Modelos"
      company={company}
      emptyMessage="Necesitas una empresa asociada para gestionar modelos."
    >
      {company ? (
        <CompanyCatalogPanel
          companyId={company.id}
          companyName={company.name ?? 'Mi empresa'}
          section="models"
          initialBrands={initialBrands}
          initialModels={initialModels}
        />
      ) : null}
    </CatalogGate>
  );
}
