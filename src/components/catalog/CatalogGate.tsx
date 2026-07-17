import Link from 'next/link';
import { Sidebar } from '@/components/dashboard/Sidebar';
import {
  canManageCatalog,
  getCompanyLifecycleLabel,
  isCompanyOnboardingComplete,
  type PortalCompany,
} from '@/lib/auth/company-status';

type CatalogGateProps = {
  title: string;
  company: PortalCompany | null;
  emptyMessage: string;
  children: React.ReactNode;
};

/** Layout + bloqueos comunes de las vistas de catálogo (productos, marcas, modelos, vitrina). */
export function CatalogGate({ title, company, emptyMessage, children }: CatalogGateProps) {
  if (!company) {
    return (
      <div className="bg-background flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 px-6 py-8">
          <h1 className="mb-2 text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mb-4 text-sm">{emptyMessage}</p>
          <Link
            href="/auth/register"
            className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
          >
            Registrar empresa
          </Link>
        </main>
      </div>
    );
  }

  if (!canManageCatalog(company)) {
    return (
      <div className="bg-background flex min-h-screen flex-col md:flex-row">
        <Sidebar />
        <main className="flex-1 px-6 py-8">
          <h1 className="mb-2 text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mb-4 text-sm">
            Estado actual: <strong>{getCompanyLifecycleLabel(company)}</strong>. Podrás gestionar el
            catálogo cuando un administrador apruebe tu empresa.
          </p>
          {!isCompanyOnboardingComplete(company) ? (
            <Link
              href="/onboarding"
              className="bg-primary text-primary-foreground inline-flex h-9 items-center rounded-md px-4 text-sm font-medium"
            >
              Completar datos
            </Link>
          ) : (
            <Link
              href="/company"
              className="border-border hover:bg-muted inline-flex h-9 items-center rounded-md border px-4 text-sm font-medium"
            >
              Ver mi empresa
            </Link>
          )}
        </main>
      </div>
    );
  }

  return (
    <div className="bg-background flex min-h-screen flex-col md:flex-row">
      <Sidebar />
      <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-6 md:px-8 lg:px-10">{children}</main>
    </div>
  );
}
