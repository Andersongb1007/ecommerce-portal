'use client';

import { useMemo } from 'react';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { previewCompanySlug } from '@/lib/validation/slug';

type SlugPreviewProps = {
  name: string;
  label?: string;
  className?: string;
};

/** Muestra el slug embebido/formateado que la API generará desde el nombre. */
export function SlugPreview({ name, label = 'URL de la tienda', className }: SlugPreviewProps) {
  const slug = useMemo(() => previewCompanySlug(name), [name]);
  const ready = name.trim().length >= 2;

  return (
    <div className={cn('space-y-2', className)}>
      {label && <Label>{label}</Label>}
      <div
        className={cn(
          'border-input bg-muted/40 flex h-11 items-center rounded-lg border px-3 text-sm',
          !ready && 'text-muted-foreground'
        )}
        aria-live="polite"
      >
        <span className="text-muted-foreground shrink-0">/</span>
        <span className="truncate font-medium tracking-tight">
          {ready ? slug : 'se-genera-desde-el-nombre'}
        </span>
      </div>
      <p className="text-muted-foreground text-xs">
        Lo genera la API automáticamente a partir del nombre comercial.
      </p>
    </div>
  );
}
