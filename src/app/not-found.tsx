import Link from 'next/link';
import { AlertCircle, ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página no encontrada | Portal Empresa',
  description: 'La página que buscas no existe o ha sido movida.',
};

export default function NotFound() {
  return (
    <div className="bg-background text-foreground relative flex min-h-screen flex-col items-center justify-center p-6">
      <div className="border-border bg-card/60 w-full max-w-md space-y-6 rounded-lg border p-8 text-center shadow-lg backdrop-blur-md">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
          <AlertCircle className="h-10 w-10" />
        </div>
        <div className="space-y-2">
          <h1 className="text-4xl font-extrabold tracking-tight">404</h1>
          <h2 className="text-xl font-bold tracking-tight">Página no encontrada</h2>
          <p className="text-muted-foreground text-sm">
            Lo sentimos, la página que intentas acceder no existe en el sistema o ha sido movida.
          </p>
        </div>
        <div className="pt-2">
          <Link
            href="/"
            className="bg-primary text-primary-foreground hover:bg-primary/90 hover:text-primary-foreground inline-flex h-10 w-full items-center justify-center gap-2 rounded-md text-sm font-medium transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}
