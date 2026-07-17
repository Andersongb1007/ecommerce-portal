'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { browserApiRequest } from '@/lib/api/browserClient';
import { portalPaths } from '@/lib/api/portal-paths';
import { normalizePaginated, type PaginatedResponse } from '@/lib/api/pagination';
import { useSyncedPaginatedList } from '@/hooks/useListQuery';
import {
  DISPLAY_TEMPLATE_LABELS,
  PRODUCT_KIND_LABELS,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogModel,
  type CatalogProduct,
  type ProductKind,
  type StorefrontData,
} from '@/lib/validation/catalog';
import { logger } from '@/lib/logger';
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  LayoutTemplate,
  Layers,
  Pencil,
  Package,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

type Tab = 'products' | 'brands' | 'models' | 'storefront';

interface CompanyCatalogPanelProps {
  companyId: string;
  companyName: string;
  initialPaginated: PaginatedResponse<CatalogProduct>;
  initialCategories: CatalogCategory[];
  initialBrands: CatalogBrand[];
  initialStorefront: StorefrontData | null;
}

function formatPrice(price: string) {
  const num = Number(price);
  return Number.isFinite(num) ? `$${num.toFixed(2)}` : `$${price}`;
}

function groupProductsForPreview(products: CatalogProduct[]) {
  const map = new Map<string, { name: string; items: CatalogProduct[] }>();
  for (const product of products) {
    const key = product.category.id;
    if (!map.has(key)) {
      map.set(key, { name: product.category.name, items: [] });
    }
    map.get(key)!.items.push(product);
  }
  return [...map.values()];
}

export function CompanyCatalogPanel({
  companyId,
  companyName,
  initialPaginated,
  initialCategories,
  initialBrands,
  initialStorefront,
}: CompanyCatalogPanelProps) {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>('products');
  const [loading, setLoading] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  const { data: products, setData: setProducts } = useSyncedPaginatedList(initialPaginated);
  const [categories, setCategories] = useState(initialCategories);
  const [brands, setBrands] = useState<CatalogBrand[]>(initialBrands);
  const [models, setModels] = useState<CatalogModel[]>([]);
  const [storefront, setStorefront] = useState<StorefrontData | null>(initialStorefront);

  const defaultProductKind: ProductKind =
    initialStorefront?.displayTemplate === 'MENU' ? 'MENU' : 'RETAIL';

  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [productKind, setProductKind] = useState<ProductKind>(defaultProductKind);
  const [productDescription, setProductDescription] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [newCategoryName, setNewCategoryName] = useState('');
  const [productBrandId, setProductBrandId] = useState('');
  const [brandName, setBrandName] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');

  const [imageProduct, setImageProduct] = useState<CatalogProduct | null>(null);
  const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);

  const triggerToast = (message: string, isError = false) => {
    setToastMessage(message);
    setToastIsError(isError);
    window.setTimeout(() => setToastMessage(null), 4000);
  };

  const refreshProducts = useCallback(async () => {
    const raw = await browserApiRequest(
      `${portalPaths.catalog.companyProducts(companyId)}?limit=50`
    );
    const paginated = normalizePaginated<CatalogProduct>(raw as PaginatedResponse<CatalogProduct>);
    setProducts(paginated.data);
    router.refresh();
  }, [companyId, router, setProducts]);

  const fetchTabData = useCallback(
    async (activeTab: Tab) => {
      setLoading(true);
      try {
        if (activeTab === 'products') {
          await refreshProducts();
        } else if (activeTab === 'brands') {
          const raw = await browserApiRequest(
            `${portalPaths.catalog.companyBrands(companyId)}?limit=50`
          );
          setBrands(normalizePaginated<CatalogBrand>(raw as PaginatedResponse<CatalogBrand>).data);
        } else if (activeTab === 'models') {
          const raw = await browserApiRequest(
            `${portalPaths.catalog.companyModels(companyId)}?limit=50`
          );
          setModels(normalizePaginated<CatalogModel>(raw as PaginatedResponse<CatalogModel>).data);
        } else {
          const data = await browserApiRequest<StorefrontData>(
            portalPaths.storefront.byCompanyId(companyId)
          );
          setStorefront(data);
        }
      } catch (err) {
        logger.error({ msg: 'Error cargando catálogo', err });
        triggerToast(err instanceof Error ? err.message : 'Error al cargar datos', true);
      } finally {
        setLoading(false);
      }
    },
    [companyId, refreshProducts]
  );

  const loadBrandsForSelect = useCallback(async () => {
    try {
      const raw = await browserApiRequest(
        `${portalPaths.catalog.companyBrands(companyId)}?limit=50`
      );
      setBrands(normalizePaginated<CatalogBrand>(raw as PaginatedResponse<CatalogBrand>).data);
    } catch (err) {
      logger.error({ msg: 'Error cargando marcas', err });
    }
  }, [companyId]);

  const switchTab = (next: Tab) => {
    setTab(next);
    void fetchTabData(next);
    if (next === 'models' || next === 'products') {
      void loadBrandsForSelect();
    }
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryId && !newCategoryName.trim()) {
      triggerToast('Selecciona o escribe una categoría', true);
      return;
    }

    try {
      await browserApiRequest(portalPaths.catalog.companyProducts(companyId), {
        method: 'POST',
        body: JSON.stringify({
          name: productName.trim(),
          price: Number(productPrice),
          productKind,
          ...(productDescription.trim() ? { description: productDescription.trim() } : {}),
          ...(categoryId ? { categoryId } : { categoryName: newCategoryName.trim() }),
          ...(productKind === 'RETAIL' && productBrandId ? { brandId: productBrandId } : {}),
        }),
      });
      setProductName('');
      setProductPrice('');
      setProductDescription('');
      setCategoryId('');
      setNewCategoryName('');
      setProductBrandId('');
      triggerToast('Producto creado correctamente');
      await refreshProducts();

      if (!categoryId && newCategoryName.trim()) {
        const raw = await browserApiRequest(`${portalPaths.catalog.categories.list}?limit=100`);
        setCategories(
          normalizePaginated<CatalogCategory>(raw as PaginatedResponse<CatalogCategory>).data
        );
      }
    } catch (err) {
      logger.error({ msg: 'Error creando producto', err });
      triggerToast(err instanceof Error ? err.message : 'Error al crear producto', true);
    }
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;
    try {
      await browserApiRequest(portalPaths.catalog.companyProduct(companyId, editProduct.id), {
        method: 'PATCH',
        body: JSON.stringify({
          name: editProduct.name.trim(),
          price: Number(editProduct.price),
          productKind: editProduct.productKind,
          description: editProduct.description ?? null,
        }),
      });
      triggerToast('Producto actualizado');
      setEditProduct(null);
      await refreshProducts();
    } catch (err) {
      logger.error({ msg: 'Error actualizando producto', err });
      triggerToast(err instanceof Error ? err.message : 'Error al actualizar producto', true);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!window.confirm('¿Eliminar este producto?')) return;
    try {
      await browserApiRequest(portalPaths.catalog.companyProduct(companyId, productId), {
        method: 'DELETE',
      });
      triggerToast('Producto eliminado');
      await refreshProducts();
    } catch (err) {
      logger.error({ msg: 'Error eliminando producto', err });
      triggerToast(err instanceof Error ? err.message : 'Error al eliminar producto', true);
    }
  };

  const handleUploadImage = async (file: File) => {
    if (!imageProduct) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      await browserApiRequest(portalPaths.catalog.companyProductImages(companyId, imageProduct.id), {
        method: 'POST',
        body: formData,
      });
      triggerToast('Imagen subida correctamente');
      const updated = await browserApiRequest<CatalogProduct>(
        portalPaths.catalog.companyProduct(companyId, imageProduct.id)
      );
      setImageProduct(updated);
      await refreshProducts();
    } catch (err) {
      logger.error({ msg: 'Error subiendo imagen', err });
      triggerToast(err instanceof Error ? err.message : 'Error al subir imagen', true);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCreateBrand = async (e: FormEvent) => {
    e.preventDefault();
    try {
      await browserApiRequest(portalPaths.catalog.companyBrands(companyId), {
        method: 'POST',
        body: JSON.stringify({ name: brandName.trim() }),
      });
      setBrandName('');
      triggerToast('Marca creada');
      void fetchTabData('brands');
    } catch (err) {
      logger.error({ msg: 'Error creando marca', err });
      triggerToast(err instanceof Error ? err.message : 'Error al crear marca', true);
    }
  };

  const handleCreateModel = async (e: FormEvent) => {
    e.preventDefault();
    if (!modelBrandId) {
      triggerToast('Selecciona una marca', true);
      return;
    }
    try {
      await browserApiRequest(portalPaths.catalog.companyModels(companyId), {
        method: 'POST',
        body: JSON.stringify({ name: modelName.trim(), brandId: modelBrandId }),
      });
      setModelName('');
      triggerToast('Modelo creado');
      void fetchTabData('models');
    } catch (err) {
      logger.error({ msg: 'Error creando modelo', err });
      triggerToast(err instanceof Error ? err.message : 'Error al crear modelo', true);
    }
  };

  const handleStorefrontTemplate = async (template: string) => {
    try {
      await browserApiRequest(portalPaths.storefront.byCompanyId(companyId), {
        method: 'PATCH',
        body: JSON.stringify({ displayTemplate: template }),
      });
      const data = await browserApiRequest<StorefrontData>(
        portalPaths.storefront.byCompanyId(companyId)
      );
      setStorefront(data);
      triggerToast('Plantilla de vitrina actualizada');
    } catch (err) {
      logger.error({ msg: 'Error actualizando vitrina', err });
      triggerToast(err instanceof Error ? err.message : 'Error al actualizar vitrina', true);
    }
  };

  const previewTemplate = storefront?.displayTemplate ?? 'GRID';
  const previewSections = previewTemplate === 'LIST' ? [] : groupProductsForPreview(products);

  const tabs: { id: Tab; label: string; icon: typeof Package }[] = [
    { id: 'products', label: 'Productos', icon: Package },
    { id: 'brands', label: 'Marcas', icon: Tag },
    { id: 'models', label: 'Modelos', icon: Layers },
    { id: 'storefront', label: 'Vitrina', icon: LayoutTemplate },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-3">
        <Link
          href="/"
          className={buttonVariants({ variant: 'ghost', className: 'animate-none' })}
        >
          <ArrowLeft className="mr-1.5 h-4 w-4" />
          Inicio
        </Link>
        <h2 className="text-foreground text-xl font-bold">{companyName}</h2>
        {storefront?.slug && (
          <span className="text-muted-foreground text-sm">/{storefront.slug}</span>
        )}
      </div>

      <div className="border-border flex flex-wrap gap-2 border-b pb-2">
        {tabs.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            onClick={() => switchTab(id)}
            className={`flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
              tab === id ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted/50'
            }`}
          >
            <Icon className="h-4 w-4" />
            {label}
          </button>
        ))}
      </div>

      {loading && <p className="text-muted-foreground text-sm">Cargando...</p>}

      {tab === 'products' && !loading && (
        <div className="space-y-4">
          <form
            onSubmit={(e) => void handleCreateProduct(e)}
            className="border-border grid gap-3 rounded-xl border p-4 md:grid-cols-2 lg:grid-cols-3"
          >
            <div>
              <Label>Nombre</Label>
              <Input
                value={productName}
                onChange={(e) => setProductName(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Precio</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={productPrice}
                onChange={(e) => setProductPrice(e.target.value)}
                required
              />
            </div>
            <div>
              <Label>Tipo de producto</Label>
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={productKind}
                onChange={(e) => {
                  const kind = e.target.value as ProductKind;
                  setProductKind(kind);
                  if (kind === 'MENU') setProductBrandId('');
                }}
              >
                {(Object.keys(PRODUCT_KIND_LABELS) as ProductKind[]).map((kind) => (
                  <option key={kind} value={kind}>
                    {PRODUCT_KIND_LABELS[kind]}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>Descripción {productKind === 'MENU' ? '(plato / ítem)' : '(opcional)'}</Label>
              <Input
                value={productDescription}
                onChange={(e) => setProductDescription(e.target.value)}
                placeholder={
                  productKind === 'MENU' ? 'Ej. Con leche de almendras' : 'Detalle del producto'
                }
              />
            </div>
            <div>
              <Label>Categoría existente</Label>
              <select
                className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  if (e.target.value) setNewCategoryName('');
                }}
              >
                <option value="">Seleccionar...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <Label>O nueva categoría</Label>
              <Input
                value={newCategoryName}
                onChange={(e) => {
                  setNewCategoryName(e.target.value);
                  if (e.target.value) setCategoryId('');
                }}
                placeholder="Se crea globalmente si no existe"
                disabled={!!categoryId}
              />
            </div>
            {productKind === 'RETAIL' && (
              <div>
                <Label>Marca (opcional)</Label>
                <select
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value={productBrandId}
                  onChange={(e) => setProductBrandId(e.target.value)}
                >
                  <option value="">Sin marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="flex items-end">
              <Button type="submit" className="w-full animate-none">
                Agregar producto
              </Button>
            </div>
          </form>

          {products.length === 0 ? (
            <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
              No hay productos. Agrega el primero con el formulario de arriba.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead>Imágenes</TableHead>
                  <TableHead className="w-36" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => (
                  <TableRow key={p.id}>
                    <TableCell className="py-4 font-semibold">{p.name}</TableCell>
                    <TableCell className="py-4 text-sm">
                      {p.productKind ? PRODUCT_KIND_LABELS[p.productKind] : '—'}
                    </TableCell>
                    <TableCell className="py-4">{p.category.name}</TableCell>
                    <TableCell className="py-4">{formatPrice(p.price)}</TableCell>
                    <TableCell className="py-4">
                      {p.productKind !== 'MENU' && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="animate-none"
                          onClick={() => setImageProduct(p)}
                        >
                          <ImagePlus className="mr-1 h-3.5 w-3.5" />
                          {p.images?.length ?? 0}
                        </Button>
                      )}
                    </TableCell>
                    <TableCell className="py-4">
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="animate-none"
                          onClick={() => setEditProduct({ ...p })}
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="text-destructive animate-none"
                          onClick={() => void handleDeleteProduct(p.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === 'brands' && !loading && (
        <div className="space-y-4">
          <form onSubmit={(e) => void handleCreateBrand(e)} className="flex gap-2">
            <Input
              value={brandName}
              onChange={(e) => setBrandName(e.target.value)}
              placeholder="Nombre de marca"
              required
            />
            <Button type="submit" className="animate-none">
              Agregar
            </Button>
          </form>
          {brands.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay marcas registradas.</p>
          ) : (
            <Table>
              <TableBody>
                {brands.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="py-4 font-semibold">{b.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === 'models' && !loading && (
        <div className="space-y-4">
          <form onSubmit={(e) => void handleCreateModel(e)} className="grid gap-2 md:grid-cols-3">
            <Input
              value={modelName}
              onChange={(e) => setModelName(e.target.value)}
              placeholder="Línea / modelo"
              required
            />
            <select
              className="border-input bg-background rounded-md border px-3 py-2 text-sm"
              value={modelBrandId}
              onChange={(e) => setModelBrandId(e.target.value)}
              required
            >
              <option value="">Marca...</option>
              {brands.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name}
                </option>
              ))}
            </select>
            <Button type="submit" className="animate-none">
              Agregar modelo
            </Button>
          </form>
          {models.length === 0 ? (
            <p className="text-muted-foreground text-sm">No hay modelos registrados.</p>
          ) : (
            <Table>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="py-4 font-semibold">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground py-4">
                      {m.brandName ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      )}

      {tab === 'storefront' && !loading && (
        <div className="grid gap-6 lg:grid-cols-2">
          {storefront ? (
            <div className="space-y-3">
              <p className="text-muted-foreground text-sm">
                Plantilla actual:{' '}
                <strong>
                  {DISPLAY_TEMPLATE_LABELS[storefront.displayTemplate] ??
                    storefront.displayTemplate}
                </strong>
              </p>
              <div className="flex flex-wrap gap-2">
                {(storefront.suggestedTemplates.length
                  ? storefront.suggestedTemplates
                  : Object.keys(DISPLAY_TEMPLATE_LABELS)
                ).map((tpl) => (
                  <Button
                    key={tpl}
                    type="button"
                    variant={storefront.displayTemplate === tpl ? 'default' : 'outline'}
                    className="animate-none"
                    onClick={() => void handleStorefrontTemplate(tpl)}
                  >
                    {DISPLAY_TEMPLATE_LABELS[tpl] ?? tpl}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">No se pudo cargar la vitrina.</p>
          )}

          <div className="border-border bg-muted/20 rounded-xl border p-4">
            <p className="text-muted-foreground mb-3 text-xs font-semibold uppercase">
              Vista previa ({previewTemplate})
            </p>
            {products.length === 0 ? (
              <p className="text-muted-foreground text-sm">Agrega productos para ver la vitrina.</p>
            ) : previewTemplate === 'LIST' ? (
              <ul className="space-y-1 text-sm">
                {products.map((p) => (
                  <li key={p.id} className="flex justify-between border-b py-1.5">
                    <span>{p.name}</span>
                    <span className="font-medium">{formatPrice(p.price)}</span>
                  </li>
                ))}
              </ul>
            ) : previewTemplate === 'MENU' ? (
              <div className="space-y-4">
                {previewSections.map((section) => (
                  <div key={section.name}>
                    <h4 className="mb-2 border-b pb-1 text-sm font-bold uppercase">
                      {section.name}
                    </h4>
                    <ul className="space-y-1 text-sm">
                      {section.items.map((p) => (
                        <li key={p.id} className="flex justify-between">
                          <span>{p.name}</span>
                          <span>{formatPrice(p.price)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {products.slice(0, 6).map((p) => {
                  const img = p.images?.find((i) => i.isPrimary) ?? p.images?.[0];
                  return (
                    <div key={p.id} className="bg-card border-border rounded-lg border p-3 text-sm">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={img.url}
                          alt={p.name}
                          className="mb-2 h-16 w-full rounded object-cover"
                        />
                      ) : (
                        <div className="bg-muted mb-2 h-16 rounded" />
                      )}
                      <p className="font-medium">{p.name}</p>
                      <p className="text-muted-foreground">{formatPrice(p.price)}</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {editProduct && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4">
          <form
            onSubmit={(e) => void handleUpdateProduct(e)}
            className="bg-card border-border w-full max-w-md rounded-xl border p-5 shadow-lg"
          >
            <div className="mb-4 flex items-start justify-between">
              <h3 className="font-semibold">Editar producto</h3>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="animate-none"
                onClick={() => setEditProduct(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-3">
              <div>
                <Label>Nombre</Label>
                <Input
                  value={editProduct.name}
                  onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Precio</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={editProduct.price}
                  onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>Tipo</Label>
                <select
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                  value={editProduct.productKind ?? 'RETAIL'}
                  onChange={(e) =>
                    setEditProduct({
                      ...editProduct,
                      productKind: e.target.value as ProductKind,
                    })
                  }
                >
                  {(Object.keys(PRODUCT_KIND_LABELS) as ProductKind[]).map((kind) => (
                    <option key={kind} value={kind}>
                      {PRODUCT_KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label>Descripción</Label>
                <Input
                  value={editProduct.description ?? ''}
                  onChange={(e) => setEditProduct({ ...editProduct, description: e.target.value })}
                />
              </div>
              <Button type="submit" className="w-full animate-none">
                Guardar cambios
              </Button>
            </div>
          </form>
        </div>
      )}

      {imageProduct && (
        <div className="bg-background/80 fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="bg-card border-border w-full max-w-md rounded-xl border p-5 shadow-lg">
            <div className="mb-4 flex items-start justify-between">
              <div>
                <h3 className="font-semibold">Imágenes — {imageProduct.name}</h3>
                <p className="text-muted-foreground text-xs">JPG, PNG o WebP</p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="animate-none"
                onClick={() => setImageProduct(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {imageProduct.images?.length ? (
              <div className="mb-4 grid grid-cols-3 gap-2">
                {imageProduct.images.map((img) => (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    key={img.id}
                    src={img.url}
                    alt=""
                    className="border-border aspect-square rounded border object-cover"
                  />
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground mb-4 text-sm">Sin imágenes aún.</p>
            )}

            <label className="border-input hover:bg-muted/50 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-6 text-sm">
              <ImagePlus className="h-4 w-4" />
              {uploadingImage ? 'Subiendo...' : 'Seleccionar imagen'}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploadingImage}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleUploadImage(file);
                  e.target.value = '';
                }}
              />
            </label>
          </div>
        </div>
      )}

      {toastMessage && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg ${
            toastIsError
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {!toastIsError && <CheckCircle2 className="h-4 w-4" />}
          <span className="text-sm font-semibold">{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
