export const CompanyStatus = {
  PENDING: 1,
  ACTIVE: 2,
  REJECTED: 3,
  SUSPENDED: 4,
} as const;

export type PortalCompany = {
  id: string;
  name?: string;
  slug?: string;
  rif?: string;
  address?: string;
  phoneNumber?: string;
  instagram?: string | null;
  x?: string | null;
  facebook?: string | null;
  tiktok?: string | null;
  status?: number;
  onboardingCompletedAt?: string | null;
  themeColor?: string | null;
  bioDescription?: string | null;
  logoFile?: { id: string } | null;
  bannerFile?: { id: string } | null;
  board?: {
    displayTemplate?: string;
    isPublished?: number;
  } | null;
};

export function isCompanyOnboardingComplete(
  company: Pick<PortalCompany, 'onboardingCompletedAt'> | null | undefined
): boolean {
  return Boolean(company?.onboardingCompletedAt);
}

export function getCompanyLifecycleLabel(company: PortalCompany | null | undefined): string {
  if (!company) return 'Sin empresa';
  if (!isCompanyOnboardingComplete(company)) return 'Datos incompletos';
  if (company.status === CompanyStatus.ACTIVE) return 'Activa';
  if (company.status === CompanyStatus.PENDING) return 'Pendiente de aprobación';
  if (company.status === CompanyStatus.REJECTED) return 'Rechazada';
  if (company.status === CompanyStatus.SUSPENDED) return 'Suspendida';
  return 'Desconocido';
}

export function canManageCatalog(company: PortalCompany | null | undefined): boolean {
  return (
    Boolean(company) &&
    isCompanyOnboardingComplete(company) &&
    company?.status === CompanyStatus.ACTIVE
  );
}
