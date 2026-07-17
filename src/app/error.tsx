'use client';

import { useEffect } from 'react';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { logger } from '@/lib/logger';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    logger.error({ msg: 'Fallo crítico capturado por Error Boundary de Next.js', error });
  }, [error]);

  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="border-border bg-card/60 w-full max-w-md space-y-6 rounded-lg border p-8 text-center shadow-lg backdrop-blur-md">
        <div className="mx-auto flex h-16 w-16 animate-pulse items-center justify-center rounded-full bg-amber-500/10 text-amber-500">
          <ShieldAlert className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">Ocurrió un error inesperado</h1>
          <p className="text-muted-foreground text-sm">
            Ha ocurrido un problema crítico en la aplicación. Hemos registrado el fallo
            automáticamente para solucionarlo.
          </p>
          {error.message && (
            <div className="mt-4 max-h-24 overflow-y-auto rounded-md border border-rose-500/20 bg-rose-500/10 p-3 text-left font-mono text-xs text-rose-500">
              <strong>Error:</strong> {error.message}
            </div>
          )}
        </div>
        <div className="flex flex-col gap-3 pt-2">
          <button
            onClick={() => reset()}
            className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors"
          >
            <RefreshCw className="h-4 w-4" />
            Reintentar la operación
          </button>
          <Link
            href="/"
            className="bg-outline border-border hover:bg-accent hover:text-foreground inline-flex h-10 w-full items-center justify-center gap-2 rounded-md border text-center text-sm font-medium transition-colors"
          >
            Ir al Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
