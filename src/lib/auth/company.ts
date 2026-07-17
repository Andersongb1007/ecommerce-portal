export interface SessionCompanyRole {
  company?: { id: string; name?: string; slug?: string; status?: number };
  role?: { name?: string };
}

export interface SessionUserWithCompanies {
  id: string;
  roles?: string[];
  userCompanyRoles?: SessionCompanyRole[];
}

/** Obtiene la empresa principal del OWNER (primera asignación por empresa). */
export function getPrimaryCompany(
  user: SessionUserWithCompanies | null | undefined
): SessionCompanyRole['company'] | null {
  if (!user?.userCompanyRoles?.length) return null;

  const ownerRole = user.userCompanyRoles.find((r) => r.role?.name === 'OWNER');
  return ownerRole?.company ?? user.userCompanyRoles[0]?.company ?? null;
}

export function getPrimaryCompanyId(
  user: SessionUserWithCompanies | null | undefined
): string | null {
  return getPrimaryCompany(user)?.id ?? null;
}

export function isCompanyOwner(user: SessionUserWithCompanies | null | undefined): boolean {
  if (!user) return false;
  if (user.roles?.includes('OWNER')) return true;
  return Boolean(user.userCompanyRoles?.some((r) => r.role?.name === 'OWNER'));
}
