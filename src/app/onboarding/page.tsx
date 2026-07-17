import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { OnboardingForm } from '@/components/company/OnboardingForm';
import { serverApiRequest } from '@/lib/api/serverClient';
import { portalPaths } from '@/lib/api/portal-paths';
import { isCompanyOnboardingComplete, type PortalCompany } from '@/lib/auth/company-status';
import { logger } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Completar datos | Portal Empresa',
  description: 'Completa los datos de tu comercio para solicitar aprobación.',
};

export default async function OnboardingPage() {
  let company: PortalCompany | null = null;

  try {
    company = await serverApiRequest<PortalCompany>(portalPaths.companies.me);
  } catch (err) {
    logger.error({ msg: 'Error cargando empresa en onboarding', err });
  }

  if (company && isCompanyOnboardingComplete(company)) {
    redirect('/');
  }

  return <OnboardingForm initialCompany={company} />;
}
