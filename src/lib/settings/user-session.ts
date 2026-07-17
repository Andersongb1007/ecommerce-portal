import type { User } from '@/context/SessionContext';

export interface AdminUserView {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phoneNumber: string;
  cedula?: string | null;
  rif?: string | null;
  roles: string[];
}

export interface SystemSettings {
  maintenanceMode: boolean;
  maxUploadSizeMb: number;
}

export function toSessionUser(view: AdminUserView, previous?: User): User {
  return {
    id: view.id,
    email: view.email,
    firstName: view.firstName,
    lastName: view.lastName,
    phoneNumber: view.phoneNumber,
    cedula: view.cedula ?? undefined,
    rif: view.rif ?? undefined,
    roles: view.roles,
    userCompanyRoles: previous?.userCompanyRoles,
  };
}

export async function syncUserSession(user: User): Promise<void> {
  const response = await fetch('/api/auth/session', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ user }),
  });

  if (!response.ok) {
    throw new Error('No se pudo actualizar la sesión local');
  }
}
