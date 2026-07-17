export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;
export type PageSize = (typeof PAGE_SIZE_OPTIONS)[number];

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: PaginationMeta;
}

export interface ListQueryState {
  page: number;
  limit: PageSize;
  search: string;
  status?: string;
  role?: string;
  type?: string;
  tab?: string;
}

type RawPaginated<T> =
  | PaginatedResponse<T>
  | {
      data: T[];
      total: number;
      page: number;
      limit: number;
    };

export function normalizePaginated<T>(raw: RawPaginated<T>): PaginatedResponse<T> {
  if ('meta' in raw && raw.meta) {
    return raw as PaginatedResponse<T>;
  }

  const flat = raw as { data: T[]; total: number; page: number; limit: number };
  const totalPages = Math.ceil(flat.total / flat.limit) || 1;

  return {
    data: flat.data,
    meta: {
      total: flat.total,
      page: flat.page,
      limit: flat.limit,
      totalPages,
      hasNextPage: flat.page < totalPages,
      hasPreviousPage: flat.page > 1,
    },
  };
}

export function parseListQuery(
  params: Record<string, string | string[] | undefined>,
  defaults: Partial<ListQueryState> = {}
): ListQueryState {
  const get = (key: string) => {
    const value = params[key];
    return Array.isArray(value) ? value[0] : value;
  };

  const limitRaw = Number(get('limit') ?? defaults.limit ?? 20);
  const limit = PAGE_SIZE_OPTIONS.includes(limitRaw as PageSize) ? (limitRaw as PageSize) : 20;

  return {
    page: Math.max(1, Number(get('page') ?? defaults.page ?? 1)),
    limit,
    search: get('search') ?? defaults.search ?? '',
    status: get('status') ?? defaults.status,
    role: get('role') ?? defaults.role,
    type: get('type') ?? defaults.type,
    tab: get('tab') ?? defaults.tab,
  };
}

export function buildListQuery(path: string, query: Partial<ListQueryState>): string {
  const params = new URLSearchParams();

  if (query.page) params.set('page', String(query.page));
  if (query.limit) params.set('limit', String(query.limit));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.status) params.set('status', query.status);
  if (query.role) params.set('role', query.role);
  if (query.type) params.set('type', query.type);

  const qs = params.toString();
  return qs ? `${path}?${qs}` : path;
}

export function listQueryToSearchParams(
  query: Partial<ListQueryState>,
  extra?: Record<string, string | undefined>
): URLSearchParams {
  const params = new URLSearchParams();

  if (query.page && query.page > 1) params.set('page', String(query.page));
  if (query.limit && query.limit !== 20) params.set('limit', String(query.limit));
  if (query.search?.trim()) params.set('search', query.search.trim());
  if (query.status) params.set('status', query.status);
  if (query.role) params.set('role', query.role);
  if (query.type) params.set('type', query.type);
  if (query.tab) params.set('tab', query.tab);

  if (extra) {
    Object.entries(extra).forEach(([key, value]) => {
      if (value) params.set(key, value);
      else params.delete(key);
    });
  }

  return params;
}
