'use client';

/**
 * Sidebar.tsx — Navegación lateral del panel, filtrada por permisos.
 *
 * En escritorio es fija; en móvil se abre como cajón sobre el contenido.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePanelMenu } from './usePanelMenu';
import { WarEngineLogo } from './WarEngineLogo';

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

function esActivo(pathname: string, href: string): boolean {
  if (href === '/dashboard') return pathname === '/dashboard';
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const items = usePanelMenu();

  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" aria-hidden="true" onClick={onClose} />}
      <aside
        className={`fixed z-40 inset-y-0 left-0 w-64 flex flex-col bg-[#0a1226] border-r border-white/10 pt-[env(safe-area-inset-top)] transition-transform duration-300 lg:sticky lg:top-0 lg:h-dvh lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        aria-label="Navegación del panel"
      >
        <div className="flex items-center gap-3 px-5 py-5 border-b border-white/10">
          <WarEngineLogo className="w-10" />
          <span className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">WARENGINE</span>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          <ul className="flex flex-col gap-1">
            {items.map((item) => {
              const activo = esActivo(pathname, item.href);
              const base =
                'flex min-h-[44px] items-center gap-3 rounded-xl px-3 text-sm font-[family-name:var(--font-pixelify)] tracking-wide transition-colors';

              if (item.proximamente) {
                return (
                  <li key={item.href}>
                    <span className={`${base} text-white/35 cursor-not-allowed`} aria-disabled="true">
                      <span aria-hidden="true" className="w-5 text-center">{item.icon}</span>
                      {item.label}
                      <span className="ml-auto rounded-full border border-white/15 px-2 text-[10px] uppercase">Pronto</span>
                    </span>
                  </li>
                );
              }

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    aria-current={activo ? 'page' : undefined}
                    className={`${base} ${
                      activo
                        ? 'bg-[#e3b341] text-[#111] shadow-[0_3px_0_#b88a1f]'
                        : 'text-white/75 hover:bg-white/5 hover:text-white'
                    }`}
                  >
                    <span aria-hidden="true" className="w-5 text-center">{item.icon}</span>
                    {item.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </aside>
    </>
  );
}
