'use client';

import { useMemo, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { Button, buttonVariants } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { FormattedTextarea } from '@/components/forms/FormattedTextarea';
import { RichTextContent } from '@/components/forms/RichTextContent';
import { browserApiRequest } from '@/lib/api/browserClient';
import { portalPaths } from '@/lib/api/portal-paths';
import { resolveMediaUrl } from '@/lib/media/url';
import { logger } from '@/lib/logger';
import {
  DISPLAY_TEMPLATE_LABELS,
  STOREFRONT_DRAFT,
  STOREFRONT_PUBLISHED,
  type CatalogProduct,
  type StorefrontData,
} from '@/lib/validation/catalog';
import { ArrowLeft, CheckCircle2, ImagePlus, LayoutTemplate, Package } from 'lucide-react';

type StorefrontEditorProps = {
  companyId: string;
  companyName: string;
  initialStorefront: StorefrontData | null;
  products: CatalogProduct[];
};

function formatPrice(price: string) {
  const num = Number(price);
  return Number.isFinite(num) ? `$${num.toFixed(2)}` : `$${price}`;
}

function groupByCategory(products: CatalogProduct[]) {
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

function primaryImage(product: CatalogProduct) {
  return product.images?.find((i) => i.isPrimary) ?? product.images?.[0];
}

export function StorefrontEditor({
  companyId,
  companyName,
  initialStorefront,
  products,
}: StorefrontEditorProps) {
  const [storefront, setStorefront] = useState(initialStorefront);
  const [themeColor, setThemeColor] = useState(initialStorefront?.themeColor ?? '#0B3D3A');
  const [bioDescription, setBioDescription] = useState(initialStorefront?.bioDescription ?? '');
  const [displayTemplate, setDisplayTemplate] = useState(
    initialStorefront?.displayTemplate ?? 'GRID'
  );
  const [isPublished, setIsPublished] = useState(
    initialStorefront?.isPublished === STOREFRONT_PUBLISHED
  );
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ msg: string; error?: boolean } | null>(null);

  const sections = useMemo(() => groupByCategory(products), [products]);
  const accent = themeColor || '#0B3D3A';
  const logoSrc = logoPreview || resolveMediaUrl(storefront?.logoUrl);
  const bannerSrc = bannerPreview || resolveMediaUrl(storefront?.bannerUrl);

  const triggerToast = (msg: string, error = false) => {
    setToast({ msg, error });
    window.setTimeout(() => setToast(null), 4000);
  };

  const handleSave = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('themeColor', themeColor);
      formData.append('bioDescription', bioDescription);
      formData.append('displayTemplate', displayTemplate);
      formData.append('isPublished', String(isPublished ? STOREFRONT_PUBLISHED : STOREFRONT_DRAFT));
      if (logoFile) formData.append('logo', logoFile);
      if (bannerFile) formData.append('banner', bannerFile);

      await browserApiRequest(portalPaths.storefront.byCompanyId(companyId), {
        method: 'PATCH',
        body: formData,
      });

      const data = await browserApiRequest<StorefrontData>(
        portalPaths.storefront.byCompanyId(companyId)
      );
      setStorefront(data);
      setThemeColor(data.themeColor ?? themeColor);
      setBioDescription(data.bioDescription ?? '');
      setDisplayTemplate(data.displayTemplate);
      setIsPublished(data.isPublished === STOREFRONT_PUBLISHED);
      setLogoFile(null);
      setBannerFile(null);
      if (logoPreview) URL.revokeObjectURL(logoPreview);
      if (bannerPreview) URL.revokeObjectURL(bannerPreview);
      setLogoPreview(null);
      setBannerPreview(null);
      triggerToast('Vitrina actualizada');
    } catch (err) {
      logger.error({ msg: 'Error guardando vitrina', err });
      triggerToast(err instanceof Error ? err.message : 'Error al guardar vitrina', true);
    } finally {
      setSaving(false);
    }
  };

  const templates = storefront?.suggestedTemplates?.length
    ? storefront.suggestedTemplates
    : Object.keys(DISPLAY_TEMPLATE_LABELS);

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
            Vitrina pública
          </h1>
          <p className="text-muted-foreground text-sm">
            Personaliza cómo te ven los clientes
            {storefront?.slug ? (
              <>
                {' '}
                · <span className="font-medium">/{storefront.slug}</span>
              </>
            ) : null}
            {' · '}
            <Link href="/company" className="text-primary underline">
              Datos de mi empresa
            </Link>
            {' · '}
            <Link href="/products" className="text-primary underline">
              Productos
            </Link>
          </p>
        </div>
      </header>

      <div className="grid gap-6 xl:grid-cols-[minmax(320px,420px)_minmax(0,1fr)]">
        <form
          onSubmit={(e) => void handleSave(e)}
          className="border-border bg-card h-fit space-y-5 rounded-xl border p-5 shadow-sm"
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold">
            <LayoutTemplate className="h-4 w-4" />
            Apariencia
          </h2>

          <div className="space-y-2">
            <Label>Plantilla</Label>
            <div className="flex flex-wrap gap-2">
              {templates.map((tpl) => (
                <Button
                  key={tpl}
                  type="button"
                  variant={displayTemplate === tpl ? 'default' : 'outline'}
                  className="animate-none"
                  onClick={() => setDisplayTemplate(tpl)}
                >
                  {DISPLAY_TEMPLATE_LABELS[tpl] ?? tpl}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="themeColor">Color de marca</Label>
            <div className="flex items-center gap-2">
              <Input
                id="themeColor"
                type="color"
                className="h-10 w-14 cursor-pointer p-1"
                value={themeColor.slice(0, 7)}
                onChange={(e) => setThemeColor(e.target.value)}
              />
              <Input
                value={themeColor}
                onChange={(e) => {
                  const next = e.target.value.trim();
                  if (/^#[0-9A-Fa-f]{0,6}$/.test(next)) setThemeColor(next.slice(0, 7));
                }}
                placeholder="#0B3D3A"
                className="font-mono text-sm"
              />
            </div>
          </div>

          <FormattedTextarea
            id="storefront-bio"
            label="Bio / descripción de la vitrina"
            value={bioDescription}
            onChange={setBioDescription}
            placeholder="Cuenta quién eres y qué ofreces…"
            rows={6}
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Logo</Label>
              {logoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={logoSrc}
                  alt="Logo"
                  className="border-border mb-2 h-16 w-16 rounded-lg border object-cover"
                />
              ) : null}
              <label className="border-input hover:bg-muted/50 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-xs">
                <ImagePlus className="h-3.5 w-3.5" />
                {logoFile ? logoFile.name : 'Subir logo'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (logoPreview) URL.revokeObjectURL(logoPreview);
                    setLogoFile(file);
                    setLogoPreview(file ? URL.createObjectURL(file) : null);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
            <div className="space-y-2">
              <Label>Banner</Label>
              {bannerSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={bannerSrc}
                  alt="Banner"
                  className="border-border mb-2 h-16 w-full rounded-lg border object-cover"
                />
              ) : null}
              <label className="border-input hover:bg-muted/50 flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-dashed px-3 py-4 text-xs">
                <ImagePlus className="h-3.5 w-3.5" />
                {bannerFile ? bannerFile.name : 'Subir banner'}
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0] ?? null;
                    if (bannerPreview) URL.revokeObjectURL(bannerPreview);
                    setBannerFile(file);
                    setBannerPreview(file ? URL.createObjectURL(file) : null);
                    e.target.value = '';
                  }}
                />
              </label>
            </div>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(e) => setIsPublished(e.target.checked)}
              className="accent-primary size-4"
            />
            Publicar vitrina (visible a clientes)
          </label>

          <Button type="submit" className="w-full animate-none" disabled={saving}>
            {saving ? 'Guardando...' : 'Guardar vitrina'}
          </Button>
        </form>

        <div className="border-border bg-muted/20 overflow-hidden rounded-xl border shadow-sm">
          <div className="border-border bg-card flex items-center justify-between border-b px-4 py-3">
            <p className="text-muted-foreground text-xs font-semibold tracking-wide uppercase">
              Vista previa · {DISPLAY_TEMPLATE_LABELS[displayTemplate] ?? displayTemplate}
            </p>
            <span
              className="rounded-full px-2 py-0.5 text-[10px] font-semibold text-white"
              style={{ backgroundColor: accent }}
            >
              {isPublished ? 'Publicada' : 'Borrador'}
            </span>
          </div>

          <div className="bg-background max-h-[80vh] overflow-y-auto">
            {bannerSrc ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={bannerSrc} alt="" className="h-36 w-full object-cover sm:h-48" />
            ) : (
              <div className="h-28 w-full sm:h-36" style={{ backgroundColor: accent }} />
            )}

            <div className="space-y-4 px-4 py-5 sm:px-6">
              <div className="flex items-end gap-3">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={logoSrc}
                    alt=""
                    className="-mt-12 h-20 w-20 rounded-xl border-4 border-white object-cover shadow-md"
                  />
                ) : (
                  <div
                    className="-mt-12 flex h-20 w-20 items-center justify-center rounded-xl border-4 border-white text-lg font-bold text-white shadow-md"
                    style={{ backgroundColor: accent }}
                  >
                    {(storefront?.name ?? companyName).slice(0, 1).toUpperCase()}
                  </div>
                )}
                <div className="pb-1">
                  <h3 className="font-display text-xl font-semibold tracking-tight">
                    {storefront?.name ?? companyName}
                  </h3>
                  {storefront?.slug ? (
                    <p className="text-muted-foreground text-xs">/{storefront.slug}</p>
                  ) : null}
                </div>
              </div>

              {bioDescription ? (
                <RichTextContent html={bioDescription} className="text-muted-foreground" />
              ) : (
                <p className="text-muted-foreground text-sm italic">Sin bio todavía.</p>
              )}

              {products.length === 0 ? (
                <div className="rounded-lg border border-dashed p-8 text-center">
                  <p className="text-muted-foreground mb-3 text-sm">
                    Todavía no hay productos para mostrar.
                  </p>
                  <Link href="/products" className={buttonVariants({ className: 'animate-none' })}>
                    Ir a productos
                  </Link>
                </div>
              ) : displayTemplate === 'MENU' ? (
                <div className="space-y-6">
                  {(sections.length ? sections : [{ name: 'Menú', items: products }]).map(
                    (block) => (
                      <div key={block.name}>
                        <h4
                          className="mb-3 border-b pb-1 text-xs font-bold tracking-wide uppercase"
                          style={{ borderColor: accent, color: accent }}
                        >
                          {block.name}
                        </h4>
                        <ul className="space-y-3">
                          {block.items.map((p) => (
                            <li key={p.id} className="flex gap-3">
                              <div className="min-w-0 flex-1">
                                <div className="flex justify-between gap-3">
                                  <span className="font-medium">{p.name}</span>
                                  <span className="shrink-0 font-semibold tabular-nums">
                                    {formatPrice(p.price)}
                                  </span>
                                </div>
                                {p.description ? (
                                  <RichTextContent
                                    html={p.description}
                                    className="text-muted-foreground mt-1 line-clamp-2 text-xs"
                                  />
                                ) : null}
                              </div>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  )}
                </div>
              ) : displayTemplate === 'LIST' ? (
                <ul className="divide-border divide-y">
                  {products.map((p) => {
                    const img = primaryImage(p);
                    return (
                      <li key={p.id} className="flex gap-3 py-3">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveMediaUrl(img.url)}
                            alt=""
                            className="h-16 w-16 shrink-0 rounded-md object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex h-16 w-16 shrink-0 items-center justify-center rounded-md">
                            <Package className="text-muted-foreground h-5 w-5" />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <div className="flex justify-between gap-2">
                            <p className="truncate font-medium">{p.name}</p>
                            <span className="shrink-0 font-semibold tabular-nums">
                              {formatPrice(p.price)}
                            </span>
                          </div>
                          {p.description ? (
                            <RichTextContent
                              html={p.description}
                              className="text-muted-foreground mt-1 line-clamp-2 text-xs"
                            />
                          ) : null}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : displayTemplate === 'CARDS' ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {products.slice(0, 6).map((p) => {
                    const img = primaryImage(p);
                    return (
                      <article
                        key={p.id}
                        className="border-border overflow-hidden rounded-xl border bg-white shadow-sm"
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveMediaUrl(img.url)}
                            alt={p.name}
                            className="h-44 w-full object-cover"
                          />
                        ) : (
                          <div className="bg-muted flex h-44 items-center justify-center">
                            <Package className="text-muted-foreground h-8 w-8" />
                          </div>
                        )}
                        <div className="space-y-2 p-4">
                          <h4 className="font-semibold">{p.name}</h4>
                          {p.description ? (
                            <RichTextContent
                              html={p.description}
                              className="text-muted-foreground line-clamp-3 text-xs"
                            />
                          ) : null}
                          <p className="text-lg font-bold tabular-nums" style={{ color: accent }}>
                            {formatPrice(p.price)}
                          </p>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {products.slice(0, 9).map((p) => {
                    const img = primaryImage(p);
                    return (
                      <div
                        key={p.id}
                        className="border-border overflow-hidden rounded-lg border bg-white"
                      >
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={resolveMediaUrl(img.url)}
                            alt={p.name}
                            className="h-28 w-full object-cover sm:h-32"
                          />
                        ) : (
                          <div className="bg-muted flex h-28 items-center justify-center sm:h-32">
                            <Package className="text-muted-foreground h-6 w-6" />
                          </div>
                        )}
                        <div className="space-y-0.5 p-2.5">
                          <p className="truncate text-sm font-medium">{p.name}</p>
                          <p
                            className="text-sm font-semibold tabular-nums"
                            style={{ color: accent }}
                          >
                            {formatPrice(p.price)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {toast && (
        <div
          className={`fixed right-6 bottom-6 z-50 flex items-center gap-2 rounded-xl px-4 py-3 shadow-lg ${
            toast.error
              ? 'bg-destructive text-destructive-foreground'
              : 'bg-primary text-primary-foreground'
          }`}
        >
          {!toast.error && <CheckCircle2 className="h-4 w-4" />}
          <span className="text-sm font-medium">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
