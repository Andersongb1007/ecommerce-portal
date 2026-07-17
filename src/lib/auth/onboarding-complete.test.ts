import { describe, expect, it } from 'vitest';
import {
  canManageCatalog,
  getCompanyLifecycleLabel,
  isCompanyOnboardingComplete,
  CompanyStatus,
} from '@/lib/auth/company-status';

describe('isCompanyOnboardingComplete', () => {
  it('es false sin fecha', () => {
    expect(isCompanyOnboardingComplete({ onboardingCompletedAt: null })).toBe(false);
    expect(isCompanyOnboardingComplete(null)).toBe(false);
  });

  it('es true con fecha', () => {
    expect(isCompanyOnboardingComplete({ onboardingCompletedAt: '2026-01-01T00:00:00.000Z' })).toBe(
      true
    );
  });
});

describe('getCompanyLifecycleLabel', () => {
  it('distingue incompleta, pendiente y activa', () => {
    expect(getCompanyLifecycleLabel({ status: CompanyStatus.PENDING })).toBe('Datos incompletos');
    expect(
      getCompanyLifecycleLabel({
        status: CompanyStatus.PENDING,
        onboardingCompletedAt: '2026-01-01',
      })
    ).toBe('Pendiente de aprobación');
    expect(
      getCompanyLifecycleLabel({
        status: CompanyStatus.ACTIVE,
        onboardingCompletedAt: '2026-01-01',
      })
    ).toBe('Activa');
  });
});

describe('canManageCatalog', () => {
  it('solo permite ACTIVE con onboarding completo', () => {
    expect(
      canManageCatalog({
        status: CompanyStatus.PENDING,
        onboardingCompletedAt: '2026-01-01',
      })
    ).toBe(false);
    expect(
      canManageCatalog({
        status: CompanyStatus.ACTIVE,
        onboardingCompletedAt: null,
      })
    ).toBe(false);
    expect(
      canManageCatalog({
        status: CompanyStatus.ACTIVE,
        onboardingCompletedAt: '2026-01-01',
      })
    ).toBe(true);
  });
});
