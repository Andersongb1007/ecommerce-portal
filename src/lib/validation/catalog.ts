export type ProductKind = 'MENU' | 'RETAIL';

export const PRODUCT_KIND_LABELS: Record<ProductKind, string> = {
  MENU: 'Menú (restaurante / cafetería)',
  RETAIL: 'Tienda (retail / repuestos)',
};

export type ProductStatus = 1 | 2 | 3;

export const PRODUCT_STATUS = {
  ACTIVE: 1 as ProductStatus,
  INACTIVE: 2 as ProductStatus,
  DRAFT: 3 as ProductStatus,
};

export const PRODUCT_STATUS_LABELS: Record<ProductStatus, string> = {
  1: 'Publicado',
  2: 'Oculto',
  3: 'Borrador',
};

export interface CatalogCategory {
  id: string;
  name: string;
  slug: string;
}

export interface CatalogProductImage {
  id: string;
  url: string;
  isPrimary: boolean;
}

export interface CatalogProduct {
  id: string;
  companyId?: string;
  companyName?: string;
  name: string;
  price: string;
  productKind?: ProductKind;
  status?: ProductStatus;
  description?: string | null;
  category: CatalogCategory;
  brand?: { id: string; name: string } | null;
  model?: { id: string; name: string } | null;
  images: CatalogProductImage[];
}

export interface CatalogBrand {
  id: string;
  name: string;
}

export interface CatalogModel {
  id: string;
  name: string;
  brandId?: string;
  brandName?: string;
}

export interface StorefrontData {
  companyId?: string;
  name?: string;
  slug?: string;
  themeColor?: string | null;
  bioDescription?: string | null;
  displayTemplate: string;
  suggestedTemplates: string[];
  isPublished: number;
  logoUrl?: string | null;
  bannerUrl?: string | null;
}

export const DISPLAY_TEMPLATE_LABELS: Record<string, string> = {
  MENU: 'Menú (restaurante)',
  GRID: 'Grid (retail)',
  LIST: 'Lista simple',
  CARDS: 'Tarjetas destacadas',
};

export const STOREFRONT_PUBLISHED = 2;
export const STOREFRONT_DRAFT = 1;

export interface AuditLogEntry {
  id: string;
  userId: string | null;
  userEmail: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  companyId: string | null;
  metadata: Record<string, unknown> | null;
  createdAt: string;
}

export const AUDIT_ACTION_LABELS: Record<string, string> = {
  CREATE: 'Creación',
  UPDATE: 'Actualización',
  DELETE: 'Eliminación',
};

export const AUDIT_RESOURCE_LABELS: Record<string, string> = {
  product: 'Producto',
  category: 'Categoría',
  brand: 'Marca',
  product_model: 'Modelo',
  storefront: 'Vitrina',
  company: 'Empresa',
  service: 'Servicio',
  user: 'Usuario',
};
