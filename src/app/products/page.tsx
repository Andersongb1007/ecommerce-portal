import type { Metadata } from 'next';
import { cookies } from 'next/headers';
import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import { CompanyCatalogPanel } from '@/components/catalog/CompanyCatalogPanel';
import { serverApiRequest } from '@/lib/api/serverClient';
import { portalPaths } from '@/lib/api/portal-paths';
import {
  buildListQuery,
  normalizePaginated,
  parseListQuery,
  type PaginatedResponse,
} from '@/lib/api/pagination';
import { getPrimaryCompany, getPrimaryCompanyId } from '@/lib/auth/company';
import type { User } from '@/context/SessionContext';
import {
  type CatalogBrand,
  type CatalogCategory,
  type CatalogProduct,
  type StorefrontData,
} from '@/lib/validation/catalog';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Productos | Portal Empresa',
  description: 'Gestiona el catálogo de productos de tu empresa.',
};

export default async function ProductsPage() {
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
      logger.error({ msg: 'Error cargando perfil en /products', err });
    }
  }

  const company = getPrimaryCompany(user);
  const companyId = company?.id;

  if (!companyId) {
    return (
      <div className="bg-background flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 px-6 py-8">
          <h1 className="mb-2 text-3xl font-bold">Productos</h1>
          <p className="text-muted-foreground mb-4 text-sm">
            Necesitas una empresa asociada para gestionar el catálogo.
          </p>
          <Link
            href="/auth/register"
            className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
          >
            Registrar empresa
          </Link>
        </main>
      </div>
    );
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
  let initialCategories: CatalogCategory[] = [];
  let initialBrands: CatalogBrand[] = [];
  let initialStorefront: StorefrontData | null = null;

  try {
    const [productsRaw, categoriesRaw, brandsRaw, storefront] = await Promise.all([
      serverApiRequest(
        buildListQuery(portalPaths.catalog.companyProducts(companyId), parseListQuery({ limit: '50' }))
      ),
      serverApiRequest(
        buildListQuery(portalPaths.catalog.categories.list, parseListQuery({ limit: '100' }))
      ),
      serverApiRequest(
        buildListQuery(portalPaths.catalog.companyBrands(companyId), parseListQuery({ limit: '50' }))
      ),
      serverApiRequest<StorefrontData>(portalPaths.storefront.byCompanyId(companyId)),
    ]);

    initialPaginated = normalizePaginated<CatalogProduct>(
      productsRaw as PaginatedResponse<CatalogProduct>
    );
    initialCategories = normalizePaginated<CatalogCategory>(
      categoriesRaw as PaginatedResponse<CatalogCategory>
    ).data;
    initialBrands = normalizePaginated<CatalogBrand>(
      brandsRaw as PaginatedResponse<CatalogBrand>
    ).data;
    initialStorefront = storefront;
  } catch (err) {
    logger.error({ msg: 'Error SSR productos portal', err });
  }

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-6 py-8 md:px-8 lg:px-12">
        <CompanyCatalogPanel
          companyId={companyId}
          companyName={company?.name ?? 'Mi empresa'}
          initialPaginated={initialPaginated}
          initialCategories={initialCategories}
          initialBrands={initialBrands}
          initialStorefront={initialStorefront}
        />
      </main>
    </div>
  );
}
