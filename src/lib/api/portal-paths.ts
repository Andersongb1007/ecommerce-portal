export const portalPaths = {
  auth: {
    register: '/portal/auth/register',
    login: '/portal/auth/login',
    refresh: '/portal/auth/refresh',
    forgotPassword: '/portal/auth/forgot-password',
    resetPassword: '/portal/auth/reset-password',
  },
  users: {
    me: '/portal/users/me',
    meProfile: '/portal/users/me/profile',
    mePassword: '/portal/users/me/password',
  },
  services: {
    list: '/portal/services',
  },
  catalog: {
    categories: {
      list: '/portal/catalog/categories',
    },
    companyBrands: (companyId: string) => `/portal/companies/${companyId}/brands`,
    companyBrand: (companyId: string, id: string) =>
      `/portal/companies/${companyId}/brands/${id}`,
    companyModels: (companyId: string) => `/portal/companies/${companyId}/models`,
    companyModel: (companyId: string, id: string) =>
      `/portal/companies/${companyId}/models/${id}`,
    companyProducts: (companyId: string) => `/portal/companies/${companyId}/products`,
    companyProduct: (companyId: string, id: string) =>
      `/portal/companies/${companyId}/products/${id}`,
    companyProductImages: (companyId: string, productId: string) =>
      `/portal/companies/${companyId}/products/${productId}/images`,
    companyProductImagesReorder: (companyId: string, productId: string) =>
      `/portal/companies/${companyId}/products/${productId}/images/reorder`,
    companyProductImage: (companyId: string, productId: string, imageId: string) =>
      `/portal/companies/${companyId}/products/${productId}/images/${imageId}`,
  },
  storefront: {
    byCompanyId: (companyId: string) => `/portal/companies/${companyId}/storefront`,
  },
} as const;

export const publicPaths = {
  fileById: (id: string) => `/files/${id}`,
} as const;

export function withPagination(path: string, page: number, limit: number): string {
  const separator = path.includes('?') ? '&' : '?';
  return `${path}${separator}page=${page}&limit=${limit}`;
}
