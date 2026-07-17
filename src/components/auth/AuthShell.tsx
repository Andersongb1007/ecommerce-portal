'use client';

import Link from 'next/link';
import { ThemeToggle } from '@/components/dashboard/ThemeToggle';

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

export function AuthShell({ title, subtitle, children }: AuthShellProps) {
  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <div className="absolute top-4 right-4 z-20 md:top-6 md:right-6">
        <ThemeToggle />
      </div>

      <aside className="auth-fade-in relative flex min-h-[38vh] flex-col justify-between overflow-hidden px-8 py-10 text-white md:min-h-screen md:w-[46%] md:px-12 md:py-14">
        <div
          className="absolute inset-0"
          style={{
            background:
              'linear-gradient(155deg, oklch(0.32 0.06 175) 0%, oklch(0.24 0.05 185) 45%, oklch(0.2 0.04 160) 100%)',
          }}
        />
        <div
          className="pointer-events-none absolute -top-24 -left-16 h-72 w-72 rounded-full opacity-40"
          style={{
            background: 'radial-gradient(circle, oklch(0.75 0.12 75 / 0.55), transparent 70%)',
          }}
        />
        <div
          className="pointer-events-none absolute right-0 bottom-0 h-80 w-80 opacity-30"
          style={{
            background: 'radial-gradient(circle, oklch(0.55 0.08 200 / 0.5), transparent 65%)',
          }}
        />
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
          }}
        />

        <div className="relative z-10">
          <Link
            href="/auth/login"
            className="font-display text-3xl font-semibold tracking-tight md:text-4xl"
          >
            Vitrina
          </Link>
          <p className="mt-2 max-w-xs text-sm text-white/75">
            El espacio de tu comercio para vender y gestionar tu catálogo.
          </p>
        </div>

        <div className="relative z-10 mt-10 max-w-md md:mt-0">
          <p className="auth-fade-up text-lg leading-relaxed text-white/90 md:text-xl">
            Registra tu empresa, completa tus datos y publica cuando estés listo.
          </p>
        </div>
      </aside>

      <main className="bg-background relative flex flex-1 flex-col justify-center px-6 py-10 md:px-14 lg:px-20">
        <div className="auth-fade-up mx-auto w-full max-w-md">
          <h1 className="font-display text-foreground text-3xl font-semibold tracking-tight">
            {title}
          </h1>
          <p className="text-muted-foreground mt-2 text-sm leading-relaxed">{subtitle}</p>
          <div className="auth-fade-up auth-delay-1 mt-8">{children}</div>
        </div>
      </main>
    </div>
  );
}
