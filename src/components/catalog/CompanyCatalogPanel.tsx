'use client';

import { useCallback, useState, type FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { FormattedTextarea } from '@/components/forms/FormattedTextarea';
import { StorefrontEditor } from '@/components/catalog/StorefrontEditor';
import { browserApiRequest } from '@/lib/api/browserClient';
import { portalPaths } from '@/lib/api/portal-paths';
import { normalizePaginated, type PaginatedResponse } from '@/lib/api/pagination';
import { useSyncedPaginatedList } from '@/hooks/useListQuery';
import {
  PRODUCT_KIND_LABELS,
  PRODUCT_STATUS,
  PRODUCT_STATUS_LABELS,
  type CatalogBrand,
  type CatalogCategory,
  type CatalogModel,
  type CatalogProduct,
  type ProductKind,
  type ProductStatus,
  type StorefrontData,
} from '@/lib/validation/catalog';
import { logger } from '@/lib/logger';
import { resolveMediaUrl } from '@/lib/media/url';
import {
  ArrowLeft,
  CheckCircle2,
  ImagePlus,
  Layers,
  Pencil,
  Package,
  Plus,
  Tag,
  Trash2,
  X,
} from 'lucide-react';

type CatalogSection = 'products' | 'brands' | 'models' | 'storefront';

interface CompanyCatalogPanelProps {
  companyId: string;
  companyName: string;
  /** Vista dedicada: cada valor es una página distinta (sin tabs). */
  section?: CatalogSection;
  initialPaginated?: PaginatedResponse<CatalogProduct>;
  initialCategories?: CatalogCategory[];
  initialBrands?: CatalogBrand[];
  initialModels?: CatalogModel[];
  initialStorefront?: StorefrontData | null;
}

function formatPrice(price: string) {
  const num = Number(price);
  return Number.isFinite(num) ? `$${num.toFixed(2)}` : `$${price}`;
}

type PendingImage = {
  id: string;
  file: File;
  previewUrl: string;
};

const EMPTY_PRODUCTS: PaginatedResponse<CatalogProduct> = {
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

export function CompanyCatalogPanel({
  companyId,
  companyName,
  section = 'products',
  initialPaginated = EMPTY_PRODUCTS,
  initialCategories = [],
  initialBrands = [],
  initialModels = [],
  initialStorefront = null,
}: CompanyCatalogPanelProps) {
  const router = useRouter();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);

  const { data: products, setData: setProducts } = useSyncedPaginatedList(initialPaginated);
  const [categories, setCategories] = useState(initialCategories);
  const [brands, setBrands] = useState<CatalogBrand[]>(initialBrands);
  const [models, setModels] = useState<CatalogModel[]>(initialModels);
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
  const [productModelId, setProductModelId] = useState('');
  const [productStatus, setProductStatus] = useState<ProductStatus>(PRODUCT_STATUS.ACTIVE);
  const [brandName, setBrandName] = useState('');
  const [modelName, setModelName] = useState('');
  const [modelBrandId, setModelBrandId] = useState('');

  const [createProductOpen, setCreateProductOpen] = useState(false);
  const [createBrandOpen, setCreateBrandOpen] = useState(false);
  const [createModelOpen, setCreateModelOpen] = useState(false);
  const [editProduct, setEditProduct] = useState<CatalogProduct | null>(null);
  const [pendingImages, setPendingImages] = useState<PendingImage[]>([]);
  const [editPendingImages, setEditPendingImages] = useState<PendingImage[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saving, setSaving] = useState(false);

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

  const refreshBrands = useCallback(async () => {
    const raw = await browserApiRequest(`${portalPaths.catalog.companyBrands(companyId)}?limit=50`);
    setBrands(normalizePaginated<CatalogBrand>(raw as PaginatedResponse<CatalogBrand>).data);
    router.refresh();
  }, [companyId, router]);

  const refreshModels = useCallback(async () => {
    const raw = await browserApiRequest(`${portalPaths.catalog.companyModels(companyId)}?limit=50`);
    setModels(normalizePaginated<CatalogModel>(raw as PaginatedResponse<CatalogModel>).data);
    router.refresh();
  }, [companyId, router]);

  const clearPendingImages = (setter: typeof setPendingImages) => {
    setter((prev) => {
      for (const img of prev) URL.revokeObjectURL(img.previewUrl);
      return [];
    });
  };

  const appendPendingImages = (files: FileList | null, setter: typeof setPendingImages) => {
    if (!files?.length) return;
    const additions: PendingImage[] = [];
    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      additions.push({
        id: crypto.randomUUID(),
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }
    if (additions.length) setter((prev) => [...prev, ...additions]);
  };

  const removePendingImage = (id: string, setter: typeof setPendingImages) => {
    setter((prev) => {
      const found = prev.find((p) => p.id === id);
      if (found) URL.revokeObjectURL(found.previewUrl);
      return prev.filter((p) => p.id !== id);
    });
  };

  const uploadProductImage = async (productId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    await browserApiRequest(portalPaths.catalog.companyProductImages(companyId, productId), {
      method: 'POST',
      body: formData,
    });
  };

  const resetProductForm = () => {
    setProductName('');
    setProductPrice('');
    setProductKind(defaultProductKind);
    setProductDescription('');
    setCategoryId('');
    setNewCategoryName('');
    setProductBrandId('');
    setProductModelId('');
    setProductStatus(PRODUCT_STATUS.ACTIVE);
    clearPendingImages(setPendingImages);
  };

  const handleCreateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!categoryId && !newCategoryName.trim()) {
      triggerToast('Selecciona o escribe una categoría', true);
      return;
    }
    if (pendingImages.length === 0) {
      triggerToast('Agrega al menos una imagen del producto', true);
      return;
    }

    const createdWithNewCategory = !categoryId && Boolean(newCategoryName.trim());
    const imagesToUpload = [...pendingImages];
    setSaving(true);
    try {
      const created = await browserApiRequest<CatalogProduct>(
        portalPaths.catalog.companyProducts(companyId),
        {
          method: 'POST',
          body: JSON.stringify({
            name: productName.trim(),
            price: Number(productPrice),
            productKind,
            status: productStatus,
            ...(productDescription.trim() ? { description: productDescription.trim() } : {}),
            ...(categoryId ? { categoryId } : { categoryName: newCategoryName.trim() }),
            ...(productKind === 'RETAIL' && productBrandId ? { brandId: productBrandId } : {}),
            ...(productKind === 'RETAIL' && productModelId ? { modelId: productModelId } : {}),
          }),
        }
      );

      for (const img of imagesToUpload) {
        await uploadProductImage(created.id, img.file);
      }

      resetProductForm();
      setCreateProductOpen(false);
      triggerToast('Producto creado correctamente');
      await refreshProducts();

      if (createdWithNewCategory) {
        const raw = await browserApiRequest(`${portalPaths.catalog.categories.list}?limit=100`);
        setCategories(
          normalizePaginated<CatalogCategory>(raw as PaginatedResponse<CatalogCategory>).data
        );
      }
    } catch (err) {
      logger.error({ msg: 'Error creando producto', err });
      triggerToast(err instanceof Error ? err.message : 'Error al crear producto', true);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateProduct = async (e: FormEvent) => {
    e.preventDefault();
    if (!editProduct) return;

    const totalImages = (editProduct.images?.length ?? 0) + editPendingImages.length;
    if (totalImages === 0) {
      triggerToast('El producto necesita al menos una imagen', true);
      return;
    }

    setSaving(true);
    try {
      await browserApiRequest(portalPaths.catalog.companyProduct(companyId, editProduct.id), {
        method: 'PATCH',
        body: JSON.stringify({
          name: editProduct.name.trim(),
          price: Number(editProduct.price),
          productKind: editProduct.productKind,
          status: editProduct.status ?? PRODUCT_STATUS.ACTIVE,
          description: editProduct.description ?? null,
          categoryId: editProduct.category.id,
          brandId: editProduct.brand?.id ?? null,
          modelId: editProduct.model?.id ?? null,
        }),
      });

      for (const img of editPendingImages) {
        await uploadProductImage(editProduct.id, img.file);
      }

      clearPendingImages(setEditPendingImages);
      triggerToast('Producto actualizado');
      setEditProduct(null);
      await refreshProducts();
    } catch (err) {
      logger.error({ msg: 'Error actualizando producto', err });
      triggerToast(err instanceof Error ? err.message : 'Error al actualizar producto', true);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteProductImage = async (imageId: string) => {
    if (!editProduct) return;
    if (!window.confirm('¿Eliminar esta imagen?')) return;
    setUploadingImage(true);
    try {
      await browserApiRequest(
        portalPaths.catalog.companyProductImage(companyId, editProduct.id, imageId),
        { method: 'DELETE' }
      );
      const updated = await browserApiRequest<CatalogProduct>(
        portalPaths.catalog.companyProduct(companyId, editProduct.id)
      );
      setEditProduct(updated);
      await refreshProducts();
      triggerToast('Imagen eliminada');
    } catch (err) {
      logger.error({ msg: 'Error eliminando imagen', err });
      triggerToast(err instanceof Error ? err.message : 'Error al eliminar imagen', true);
    } finally {
      setUploadingImage(false);
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

  const handleCreateBrand = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await browserApiRequest(portalPaths.catalog.companyBrands(companyId), {
        method: 'POST',
        body: JSON.stringify({ name: brandName.trim() }),
      });
      setBrandName('');
      setCreateBrandOpen(false);
      triggerToast('Marca creada');
      await refreshBrands();
    } catch (err) {
      logger.error({ msg: 'Error creando marca', err });
      triggerToast(err instanceof Error ? err.message : 'Error al crear marca', true);
    } finally {
      setSaving(false);
    }
  };

  const handleCreateModel = async (e: FormEvent) => {
    e.preventDefault();
    if (!modelBrandId) {
      triggerToast('Selecciona una marca', true);
      return;
    }
    setSaving(true);
    try {
      await browserApiRequest(portalPaths.catalog.companyModels(companyId), {
        method: 'POST',
        body: JSON.stringify({ name: modelName.trim(), brandId: modelBrandId }),
      });
      setModelName('');
      setModelBrandId('');
      setCreateModelOpen(false);
      triggerToast('Modelo creado');
      await refreshModels();
    } catch (err) {
      logger.error({ msg: 'Error creando modelo', err });
      triggerToast(err instanceof Error ? err.message : 'Error al crear modelo', true);
    } finally {
      setSaving(false);
    }
  };

  const toastNode = toastMessage ? (
    <div
      className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg ${
        toastIsError
          ? 'bg-destructive text-destructive-foreground'
          : 'bg-primary text-primary-foreground'
      }`}
    >
      {!toastIsError && <CheckCircle2 className="h-4 w-4" />}
      <span className="text-sm font-medium">{toastMessage}</span>
    </div>
  ) : null;

  if (section === 'storefront') {
    return (
      <StorefrontEditor
        companyId={companyId}
        companyName={companyName}
        initialStorefront={storefront}
        products={products}
      />
    );
  }

  if (section === 'brands') {
    return (
      <div className="w-full space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className={buttonVariants({ variant: 'ghost', className: 'animate-none' })}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Inicio
            </Link>
            <h1 className="font-display text-foreground flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              <Tag className="h-7 w-7" />
              Marcas
            </h1>
            <p className="text-muted-foreground text-sm">
              Auxiliar para productos retail · {companyName}.{' '}
              <Link href="/products" className="text-primary underline">
                Ver productos
              </Link>
              {' · '}
              <Link href="/models" className="text-primary underline">
                Ver modelos
              </Link>
            </p>
          </div>
          <Button type="button" className="animate-none" onClick={() => setCreateBrandOpen(true)}>
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar marca
          </Button>
        </header>

        {brands.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            No hay marcas. Usa el botón para agregar la primera.
          </p>
        ) : (
          <div className="border-border overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nombre</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {brands.map((b) => (
                  <TableRow key={b.id}>
                    <TableCell className="py-3 font-medium">{b.name}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog
          open={createBrandOpen}
          onOpenChange={(open) => {
            setCreateBrandOpen(open);
            if (!open) setBrandName('');
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar marca</DialogTitle>
              <DialogDescription>
                Las marcas ayudan a organizar productos retail. No son la vitrina pública.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => void handleCreateBrand(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="brand-name">Nombre</Label>
                <Input
                  id="brand-name"
                  value={brandName}
                  onChange={(e) => setBrandName(e.target.value)}
                  placeholder="Ej. Acme"
                  required
                  autoFocus
                />
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="animate-none"
                  onClick={() => setCreateBrandOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="animate-none" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear marca'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {toastNode}
      </div>
    );
  }

  if (section === 'models') {
    return (
      <div className="w-full space-y-6">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <Link
              href="/"
              className={buttonVariants({ variant: 'ghost', className: 'animate-none' })}
            >
              <ArrowLeft className="mr-1.5 h-4 w-4" />
              Inicio
            </Link>
            <h1 className="font-display text-foreground flex items-center gap-2 text-2xl font-semibold tracking-tight sm:text-3xl">
              <Layers className="h-7 w-7" />
              Modelos
            </h1>
            <p className="text-muted-foreground text-sm">
              Líneas por marca · {companyName}.{' '}
              <Link href="/brands" className="text-primary underline">
                Ver marcas
              </Link>
              {' · '}
              <Link href="/products" className="text-primary underline">
                Ver productos
              </Link>
            </p>
          </div>
          <Button
            type="button"
            className="animate-none"
            disabled={brands.length === 0}
            onClick={() => setCreateModelOpen(true)}
          >
            <Plus className="mr-1.5 h-4 w-4" />
            Agregar modelo
          </Button>
        </header>

        {brands.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            Primero crea una{' '}
            <Link href="/brands" className="text-primary font-medium underline">
              marca
            </Link>{' '}
            para poder agregar modelos.
          </p>
        ) : models.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            No hay modelos. Usa el botón para agregar el primero.
          </p>
        ) : (
          <div className="border-border overflow-hidden rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Modelo</TableHead>
                  <TableHead>Marca</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {models.map((m) => (
                  <TableRow key={m.id}>
                    <TableCell className="py-3 font-medium">{m.name}</TableCell>
                    <TableCell className="text-muted-foreground py-3">
                      {m.brandName ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        <Dialog
          open={createModelOpen}
          onOpenChange={(open) => {
            setCreateModelOpen(open);
            if (!open) {
              setModelName('');
              setModelBrandId('');
            }
          }}
        >
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Agregar modelo</DialogTitle>
              <DialogDescription>
                Asocia una línea o modelo a una marca existente.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={(e) => void handleCreateModel(e)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="model-name">Nombre</Label>
                <Input
                  id="model-name"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Línea / modelo"
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="model-brand">Marca</Label>
                <select
                  id="model-brand"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={modelBrandId}
                  onChange={(e) => setModelBrandId(e.target.value)}
                  required
                >
                  <option value="">Seleccionar marca...</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="animate-none"
                  onClick={() => setCreateModelOpen(false)}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="animate-none" disabled={saving}>
                  {saving ? 'Guardando...' : 'Crear modelo'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {toastNode}
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <Link
            href="/"
            className={buttonVariants({ variant: 'ghost', className: 'animate-none' })}
          >
            <ArrowLeft className="mr-1.5 h-4 w-4" />
            Inicio
          </Link>
          <h1 className="font-display text-foreground text-2xl font-semibold tracking-tight sm:text-3xl">
            Productos
          </h1>
          <p className="text-muted-foreground text-sm">
            {companyName}
            {storefront?.slug ? (
              <>
                {' '}
                · <span className="font-medium">/{storefront.slug}</span>
              </>
            ) : null}
            {' · '}
            <Link href="/brands" className="text-primary underline">
              Marcas
            </Link>
            {' · '}
            <Link href="/models" className="text-primary underline">
              Modelos
            </Link>
            {' · '}
            <Link href="/storefront" className="text-primary underline">
              Vitrina
            </Link>
          </p>
        </div>
        <Button type="button" className="animate-none" onClick={() => setCreateProductOpen(true)}>
          <Plus className="mr-1.5 h-4 w-4" />
          Agregar producto
        </Button>
      </header>

      <section className="space-y-3">
        <h2 className="text-base font-semibold">
          Tus productos{' '}
          <span className="text-muted-foreground font-normal">({products.length})</span>
        </h2>
        {products.length === 0 ? (
          <p className="text-muted-foreground rounded-xl border border-dashed p-8 text-center text-sm">
            No hay productos. Usa el botón para agregar el primero.
          </p>
        ) : (
          <div className="border-border overflow-x-auto rounded-xl border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">Foto</TableHead>
                  <TableHead>Producto</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Categoría</TableHead>
                  <TableHead>Precio</TableHead>
                  <TableHead className="w-28" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((p) => {
                  const thumb = p.images?.find((i) => i.isPrimary) ?? p.images?.[0];
                  return (
                    <TableRow key={p.id}>
                      <TableCell className="py-2">
                        {thumb ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveMediaUrl(thumb.url)}
                            alt=""
                            className="border-border h-12 w-12 rounded-md border object-cover"
                          />
                        ) : (
                          <div className="bg-muted text-muted-foreground flex h-12 w-12 items-center justify-center rounded-md">
                            <ImagePlus className="h-4 w-4" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="max-w-[200px] truncate py-3 font-semibold">
                        {p.name}
                      </TableCell>
                      <TableCell className="py-3 text-sm whitespace-nowrap">
                        {p.productKind ? PRODUCT_KIND_LABELS[p.productKind] : '—'}
                      </TableCell>
                      <TableCell className="py-3 whitespace-nowrap">{p.category.name}</TableCell>
                      <TableCell className="py-3 whitespace-nowrap tabular-nums">
                        {formatPrice(p.price)}
                      </TableCell>
                      <TableCell className="py-3">
                        <div className="flex gap-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="animate-none"
                            onClick={() => {
                              clearPendingImages(setEditPendingImages);
                              setEditProduct({ ...p });
                            }}
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
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </section>

      <Dialog
        open={createProductOpen}
        onOpenChange={(open) => {
          setCreateProductOpen(open);
          if (!open) resetProductForm();
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Agregar producto</DialogTitle>
            <DialogDescription>
              Marcas y modelos son opcionales (útiles en retail). La vitrina se configura aparte.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => void handleCreateProduct(e)} className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="product-name">Nombre</Label>
                <Input
                  id="product-name"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-price">Precio</Label>
                <Input
                  id="product-price"
                  type="number"
                  step="0.01"
                  min="0"
                  value={productPrice}
                  onChange={(e) => setProductPrice(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-kind">Tipo de producto</Label>
                <select
                  id="product-kind"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={productKind}
                  onChange={(e) => {
                    const kind = e.target.value as ProductKind;
                    setProductKind(kind);
                    if (kind === 'MENU') {
                      setProductBrandId('');
                      setProductModelId('');
                    }
                  }}
                >
                  {(Object.keys(PRODUCT_KIND_LABELS) as ProductKind[]).map((kind) => (
                    <option key={kind} value={kind}>
                      {PRODUCT_KIND_LABELS[kind]}
                    </option>
                  ))}
                </select>
              </div>
              <div className="space-y-2 sm:col-span-2">
                <FormattedTextarea
                  id="product-description"
                  label={`Descripción ${productKind === 'MENU' ? '(plato / ítem)' : '(opcional)'}`}
                  value={productDescription}
                  onChange={setProductDescription}
                  placeholder={
                    productKind === 'MENU' ? 'Ej. Con leche de almendras' : 'Detalle del producto'
                  }
                  rows={4}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-category">Categoría existente</Label>
                <select
                  id="product-category"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
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
              <div className="space-y-2">
                <Label htmlFor="product-new-category">O nueva categoría</Label>
                <Input
                  id="product-new-category"
                  value={newCategoryName}
                  onChange={(e) => {
                    setNewCategoryName(e.target.value);
                    if (e.target.value) setCategoryId('');
                  }}
                  placeholder="Se crea si no existe"
                  disabled={!!categoryId}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="product-status">Estado</Label>
                <select
                  id="product-status"
                  className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                  value={productStatus}
                  onChange={(e) => setProductStatus(Number(e.target.value) as ProductStatus)}
                >
                  {(
                    [
                      PRODUCT_STATUS.ACTIVE,
                      PRODUCT_STATUS.INACTIVE,
                      PRODUCT_STATUS.DRAFT,
                    ] as ProductStatus[]
                  ).map((status) => (
                    <option key={status} value={status}>
                      {PRODUCT_STATUS_LABELS[status]}
                    </option>
                  ))}
                </select>
              </div>
              {productKind === 'RETAIL' && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="product-brand">Marca (opcional)</Label>
                    <select
                      id="product-brand"
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      value={productBrandId}
                      onChange={(e) => {
                        setProductBrandId(e.target.value);
                        setProductModelId('');
                      }}
                    >
                      <option value="">Sin marca</option>
                      {brands.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="product-model">Modelo (opcional)</Label>
                    <select
                      id="product-model"
                      className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                      value={productModelId}
                      onChange={(e) => setProductModelId(e.target.value)}
                      disabled={!productBrandId}
                    >
                      <option value="">Sin modelo</option>
                      {models
                        .filter((m) => !productBrandId || m.brandId === productBrandId)
                        .map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                    </select>
                  </div>
                </>
              )}
              <div className="space-y-2 sm:col-span-2">
                <Label>Imágenes *</Label>
                <p className="text-muted-foreground text-xs">Al menos una foto. JPG, PNG o WebP.</p>
                {pendingImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                    {pendingImages.map((img) => (
                      <div
                        key={img.id}
                        className="border-border relative overflow-hidden rounded-lg border"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={img.previewUrl}
                          alt=""
                          className="aspect-square w-full object-cover"
                        />
                        <button
                          type="button"
                          className="bg-background/90 absolute top-1 right-1 rounded-full p-1 shadow"
                          onClick={() => removePendingImage(img.id, setPendingImages)}
                          aria-label="Quitar imagen"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="border-input hover:bg-muted/50 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-sm">
                  <ImagePlus className="h-4 w-4" />
                  {pendingImages.length ? 'Agregar más fotos' : 'Seleccionar imágenes'}
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      appendPendingImages(e.target.files, setPendingImages);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                className="animate-none"
                onClick={() => setCreateProductOpen(false)}
              >
                Cancelar
              </Button>
              <Button type="submit" className="animate-none" disabled={saving}>
                {saving ? 'Guardando...' : 'Crear producto'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={Boolean(editProduct)}
        onOpenChange={(open) => {
          if (!open) {
            setEditProduct(null);
            clearPendingImages(setEditPendingImages);
          }
        }}
      >
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar producto</DialogTitle>
            <DialogDescription>
              Actualiza los datos e imágenes. La primera foto queda como principal.
            </DialogDescription>
          </DialogHeader>
          {editProduct && (
            <form onSubmit={(e) => void handleUpdateProduct(e)} className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label>Nombre</Label>
                  <Input
                    value={editProduct.name}
                    onChange={(e) => setEditProduct({ ...editProduct, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Precio</Label>
                  <Input
                    type="number"
                    step="0.01"
                    value={editProduct.price}
                    onChange={(e) => setEditProduct({ ...editProduct, price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tipo</Label>
                  <select
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
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
                <div className="space-y-2">
                  <Label>Estado</Label>
                  <select
                    className="border-input bg-background h-9 w-full rounded-md border px-3 text-sm"
                    value={editProduct.status ?? PRODUCT_STATUS.ACTIVE}
                    onChange={(e) =>
                      setEditProduct({
                        ...editProduct,
                        status: Number(e.target.value) as ProductStatus,
                      })
                    }
                  >
                    {(
                      [
                        PRODUCT_STATUS.ACTIVE,
                        PRODUCT_STATUS.INACTIVE,
                        PRODUCT_STATUS.DRAFT,
                      ] as ProductStatus[]
                    ).map((status) => (
                      <option key={status} value={status}>
                        {PRODUCT_STATUS_LABELS[status]}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2 sm:col-span-2">
                  <FormattedTextarea
                    id="edit-product-description"
                    label="Descripción"
                    value={editProduct.description ?? ''}
                    onChange={(description) => setEditProduct({ ...editProduct, description })}
                    rows={4}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Imágenes</Label>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                  {(editProduct.images ?? []).map((img) => (
                    <div
                      key={img.id}
                      className="border-border relative overflow-hidden rounded-lg border"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={resolveMediaUrl(img.url)}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      {img.isPrimary && (
                        <span className="bg-primary text-primary-foreground absolute bottom-1 left-1 rounded px-1 text-[10px] font-medium">
                          Principal
                        </span>
                      )}
                      <button
                        type="button"
                        className="bg-background/90 absolute top-1 right-1 rounded-full p-1 shadow disabled:opacity-50"
                        disabled={uploadingImage}
                        onClick={() => void handleDeleteProductImage(img.id)}
                        aria-label="Eliminar imagen"
                      >
                        <Trash2 className="text-destructive h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                  {editPendingImages.map((img) => (
                    <div
                      key={img.id}
                      className="border-border relative overflow-hidden rounded-lg border border-dashed"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.previewUrl}
                        alt=""
                        className="aspect-square w-full object-cover"
                      />
                      <span className="bg-muted absolute bottom-1 left-1 rounded px-1 text-[10px]">
                        Nueva
                      </span>
                      <button
                        type="button"
                        className="bg-background/90 absolute top-1 right-1 rounded-full p-1 shadow"
                        onClick={() => removePendingImage(img.id, setEditPendingImages)}
                        aria-label="Quitar imagen"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
                <label className="border-input hover:bg-muted/50 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-4 py-5 text-sm">
                  <ImagePlus className="h-4 w-4" />
                  Agregar imágenes
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    multiple
                    className="hidden"
                    onChange={(e) => {
                      appendPendingImages(e.target.files, setEditPendingImages);
                      e.target.value = '';
                    }}
                  />
                </label>
              </div>

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  className="animate-none"
                  onClick={() => {
                    setEditProduct(null);
                    clearPendingImages(setEditPendingImages);
                  }}
                >
                  Cancelar
                </Button>
                <Button type="submit" className="animate-none" disabled={saving || uploadingImage}>
                  {saving ? 'Guardando...' : 'Guardar cambios'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {toastNode}
    </div>
  );
}
