'use client';

import { Search, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PAGE_SIZE_OPTIONS, type PaginationMeta, type PageSize } from '@/lib/api/pagination';

interface DataTableControlsProps {
  meta: PaginationMeta;
  search: string;
  searchPlaceholder?: string;
  onSearchChange: (value: string) => void;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: PageSize) => void;
  isLoading?: boolean;
  filters?: React.ReactNode;
  actions?: React.ReactNode;
}

export function DataTableControls({
  meta,
  search,
  searchPlaceholder = 'Buscar...',
  onSearchChange,
  onPageChange,
  onLimitChange,
  isLoading = false,
  filters,
  actions,
}: DataTableControlsProps) {
  const from = meta.total === 0 ? 0 : (meta.page - 1) * meta.limit + 1;
  const to = Math.min(meta.page * meta.limit, meta.total);

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-1 flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative max-w-md flex-1">
            <Search className="text-muted-foreground absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2" />
            <Input
              placeholder={searchPlaceholder}
              className="pl-10"
              value={search}
              onChange={(e) => onSearchChange(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {filters}
        </div>
        {actions}
      </div>

      <div className="flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-muted-foreground text-sm">
          {meta.total === 0
            ? 'Sin resultados'
            : `Mostrando ${from}-${to} de ${meta.total} registros`}
        </p>

        <div className="flex flex-wrap items-center gap-3">
          <label className="text-muted-foreground flex items-center gap-2 text-sm">
            Filas
            <select
              value={meta.limit}
              onChange={(e) => onLimitChange(Number(e.target.value) as PageSize)}
              disabled={isLoading}
              className="border-input bg-background ring-offset-background focus-visible:ring-ring h-9 rounded-md border px-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
            >
              {PAGE_SIZE_OPTIONS.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </label>

          <div className="flex items-center gap-1">
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || !meta.hasPreviousPage}
              onClick={() => onPageChange(meta.page - 1)}
              className="animate-none"
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            <span className="text-muted-foreground px-2 text-sm">
              Página {meta.page} de {meta.totalPages}
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              disabled={isLoading || !meta.hasNextPage}
              onClick={() => onPageChange(meta.page + 1)}
              className="animate-none"
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
