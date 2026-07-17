'use client';

import React, { createContext, useContext, useState } from 'react';
import { useRouter } from 'next/navigation';
import { logger } from '@/lib/logger';
import {
  getPrimaryCompany,
  getPrimaryCompanyId,
  isCompanyOwner,
  type SessionCompanyRole,
} from '@/lib/auth/company';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  cedula?: string;
  rif?: string;
  phoneNumber: string;
  roles: string[];
  userCompanyRoles?: SessionCompanyRole[];
}

interface SessionContextType {
  user: User | null;
  loading: boolean;
  login: (user: User) => void;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
  isOwner: boolean;
  companyId: string | null;
  companyName: string | null;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

interface SessionProviderProps {
  children: React.ReactNode;
  initialUser: User | null;
}

export function SessionProvider({ children, initialUser }: SessionProviderProps) {
  const [user, setUser] = useState<User | null>(initialUser);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const login = (newUser: User) => {
    setUser(newUser);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      setUser(null);
      router.push('/auth/login');
    } catch (e) {
      logger.error({ msg: 'Error al cerrar sesión', err: e });
    } finally {
      setLoading(false);
    }
  };

  const hasRole = (role: string) => {
    return user?.roles.includes(role) || false;
  };

  const company = getPrimaryCompany(user);
  const isOwner = isCompanyOwner(user);
  const companyId = getPrimaryCompanyId(user);
  const companyName = company?.name ?? null;

  return (
    <SessionContext.Provider
      value={{
        user,
        loading,
        login,
        logout,
        hasRole,
        isOwner,
        companyId,
        companyName,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession debe ser utilizado dentro de un SessionProvider');
  }
  return context;
}
