'use client';

import { useCallback, useEffect, useState, useTransition } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  type ListQueryState,
  type PageSize,
  type PaginatedResponse,
  listQueryToSearchParams,
  parseListQuery,
} from '@/lib/api/pagination';

export function useListQuery(defaults?: Partial<ListQueryState>) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const query = parseListQuery(Object.fromEntries(searchParams.entries()), defaults);

  const updateQuery = useCallback(
    (updates: Partial<ListQueryState>, resetPage = false) => {
      const next: Partial<ListQueryState> = {
        ...query,
        ...updates,
        page: resetPage ? 1 : (updates.page ?? query.page),
      };

      const params = listQueryToSearchParams(next);
      const qs = params.toString();
      startTransition(() => {
        router.push(qs ? `${pathname}?${qs}` : pathname);
      });
    },
    [query, pathname, router]
  );

  return { query, updateQuery, isPending };
}

export function useDebouncedSearch(
  initialValue: string,
  delayMs = 400
): [string, string, (value: string) => void] {
  const [inputValue, setInputValue] = useState(initialValue);
  const [debouncedValue, setDebouncedValue] = useState(initialValue);
  const [trackedInitial, setTrackedInitial] = useState(initialValue);

  if (initialValue !== trackedInitial) {
    setTrackedInitial(initialValue);
    setInputValue(initialValue);
    setDebouncedValue(initialValue);
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(inputValue);
    }, delayMs);
    return () => clearTimeout(timer);
  }, [inputValue, delayMs]);

  return [inputValue, debouncedValue, setInputValue];
}

export function usePageSize(defaultLimit: PageSize = 20) {
  return defaultLimit;
}

/** Sincroniza listas paginadas del SSR cuando cambian los query params. */
export function useSyncedPaginatedList<T>(initialPaginated: PaginatedResponse<T>) {
  const [data, setData] = useState(initialPaginated.data);
  const [meta, setMeta] = useState(initialPaginated.meta);
  const signature = JSON.stringify({
    page: initialPaginated.meta.page,
    limit: initialPaginated.meta.limit,
    total: initialPaginated.meta.total,
    ids: initialPaginated.data.map((item) => (item as { id: string }).id),
  });
  const [trackedSignature, setTrackedSignature] = useState(signature);

  if (signature !== trackedSignature) {
    setTrackedSignature(signature);
    setData(initialPaginated.data);
    setMeta(initialPaginated.meta);
  }

  return { data, setData, meta, setMeta };
}
