'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Building2,
  Package,
  Settings,
  Menu,
  X,
  Store,
  LogOut,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from './ThemeToggle';
import { useSession } from '@/context/SessionContext';

const menuItems = [
  { href: '/', label: 'Inicio', icon: LayoutDashboard },
  { href: '/company', label: 'Mi empresa', icon: Building2 },
  { href: '/products', label: 'Productos', icon: Package },
  { href: '/storefront', label: 'Vitrina', icon: Store },
  { href: '/settings', label: 'Ajustes', icon: Settings },
];

export function Sidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const { user, companyName, logout } = useSession();

  const toggleSidebar = () => setIsOpen(!isOpen);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  return (
    <>
      <div className="bg-card text-card-foreground flex items-center justify-between border-b px-4 py-3 md:hidden">
        <Link href="/" className="text-foreground text-xl font-bold tracking-tight">
          PortalEmpresa
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          aria-label={isOpen ? 'Cerrar menú' : 'Abrir menú'}
        >
          {isOpen ? (
            <X className="text-foreground h-6 w-6" />
          ) : (
            <Menu className="text-foreground h-6 w-6" />
          )}
        </Button>
      </div>

      {isOpen && (
        <div
          className="bg-background/80 fixed inset-0 z-40 backdrop-blur-sm md:hidden"
          onClick={toggleSidebar}
        />
      )}

      <aside
        className={`bg-card text-card-foreground fixed inset-y-0 left-0 z-50 flex w-64 flex-col border-r transition-transform duration-300 md:static md:translate-x-0 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 flex-col justify-center border-b px-6">
          <Link href="/" className="text-primary text-xl font-bold tracking-tight">
            PortalEmpresa
          </Link>
          {companyName && (
            <span className="text-muted-foreground truncate text-xs">{companyName}</span>
          )}
        </div>

        <nav className="flex-1 space-y-1 px-4 py-6" aria-label="Navegación del portal">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === '/' ? pathname === '/' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
                onClick={() => setIsOpen(false)}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {user && (
          <div className="flex flex-col gap-3 border-t p-4">
            <div className="flex items-center gap-3 px-2">
              <div className="bg-primary/10 text-primary flex h-9 w-9 items-center justify-center rounded-full font-bold">
                {user.firstName[0].toUpperCase()}
              </div>
              <div className="flex min-w-0 flex-col">
                <span className="text-foreground truncate text-sm font-semibold">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-muted-foreground truncate text-xs">{user.email}</span>
              </div>
            </div>

            <button
              onClick={() => void logout()}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2 text-left text-sm font-medium text-rose-500 transition-colors hover:bg-rose-500/10 hover:text-rose-600"
            >
              <LogOut className="h-5 w-5" />
              Cerrar Sesión
            </button>
          </div>
        )}

        <div className="bg-muted/20 flex h-16 shrink-0 items-center justify-between border-t px-6">
          <span className="text-muted-foreground text-xs">v0.1.0</span>
          <ThemeToggle />
        </div>
      </aside>
    </>
  );
}

export default Sidebar;
