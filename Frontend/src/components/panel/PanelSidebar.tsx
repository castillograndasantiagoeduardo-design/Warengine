'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  label: string;
  href: string;
  badge?: string;
  icon: (active: boolean) => React.ReactNode;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

export function PanelSidebar() {
  const pathname = usePathname();

  const navSections: NavSection[] = [
    {
      title: 'ANÁLISIS & CONTROL',
      items: [
        {
          label: 'Dashboard Ejecutivo',
          href: '/admin/dashboard',
          icon: (active) => (
            <svg
              className={`w-5 h-5 transition-colors ${active ? 'text-[#e3b341]' : 'text-white/60 group-hover:text-white'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'ORGANIZACIÓN',
      items: [
        {
          label: 'Sucursales & Áreas',
          href: '/admin/sucursales',
          icon: (active) => (
            <svg
              className={`w-5 h-5 transition-colors ${active ? 'text-[#e3b341]' : 'text-white/60 group-hover:text-white'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          ),
        },
        {
          label: 'Usuarios & Personal',
          href: '/admin/usuarios',
          icon: (active) => (
            <svg
              className={`w-5 h-5 transition-colors ${active ? 'text-[#e3b341]' : 'text-white/60 group-hover:text-white'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ),
        },
      ],
    },
    {
      title: 'OPERACIÓN GLOBAL',
      items: [
        {
          label: 'Inventario & Alertas',
          href: '/admin/inventario',
          badge: 'Stock',
          icon: (active) => (
            <svg
              className={`w-5 h-5 transition-colors ${active ? 'text-[#e3b341]' : 'text-white/60 group-hover:text-white'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
          ),
        },
        {
          label: 'Bitácora de Auditoría',
          href: '/admin/auditoria',
          badge: 'Solo Admin',
          icon: (active) => (
            <svg
              className={`w-5 h-5 transition-colors ${active ? 'text-[#e3b341]' : 'text-white/60 group-hover:text-white'}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          ),
        },
      ],
    },
  ];

  const [userEmail, setUserEmail] = React.useState('superadmin@warengine.local');

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem('warengine_user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.email) setUserEmail(u.email);
      }
    } catch {
      // ignore
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('warengine_access_token');
    localStorage.removeItem('warengine_user');
    localStorage.removeItem('warengine_permisos');
    document.cookie = 'warengine_access_token=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'warengine_role_id=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'access_token=; path=/; max-age=0; SameSite=Lax';
    window.location.href = '/acceso';
  };

  return (
    <aside className="w-64 xl:w-72 shrink-0 bg-[#0c142b]/95 border-r border-white/10 flex flex-col justify-between h-screen sticky top-0 z-40 select-none backdrop-blur-md">
      {/* Encabezado: Logotipo y Badge de Rol */}
      <div>
        <div className="p-5 border-b border-white/10 flex items-center gap-3">
          {/* Isotipo WarEngine */}
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-br from-[#1a2b54] to-[#0a1124] border border-[#e3b341]/40 flex items-center justify-center shadow-[0_4px_12px_rgba(227,179,65,0.15)] shrink-0">
            <svg className="w-6 h-6 text-[#e3b341]" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2L3 7v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-9-5zm0 3.3l6 3.33v4.47c0 3.88-2.6 7.55-6 8.8-3.4-1.25-6-4.92-6-8.8V8.63l6-3.33z" />
            </svg>
            <div className="absolute inset-0 rounded-xl bg-[#e3b341]/10 animate-pulse pointer-events-none" />
          </div>

          <div className="flex flex-col min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-[family-name:var(--font-anton)] text-xl tracking-wider text-white">
                WAR<span className="text-[#e3b341]">ENGINE</span>
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-[#e3b341]/20 text-[#e3b341] border border-[#e3b341]/30 font-[family-name:var(--font-pixelify)]">
                SUPER ADMIN
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            </div>
          </div>
        </div>

        {/* Lista de Navegación */}
        <nav className="p-3 space-y-6 overflow-y-auto max-h-[calc(100vh-170px)]">
          {navSections.map((section) => (
            <div key={section.title} className="space-y-1">
              <div className="px-3 text-[10px] uppercase font-bold text-white/40 tracking-widest font-[family-name:var(--font-archivo)]">
                {section.title}
              </div>
              <div className="mt-2 space-y-1">
                {section.items.map((item) => {
                  const isActive = pathname === item.href || (item.href !== '/admin/dashboard' && pathname?.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group relative flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-gradient-to-r from-[#e3b341]/20 via-[#e3b341]/10 to-transparent text-white border-l-4 border-[#e3b341] shadow-[0_2px_12px_rgba(227,179,65,0.1)]'
                          : 'text-white/70 hover:bg-white/5 hover:text-white border-l-4 border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        {item.icon(isActive)}
                        <span className="font-[family-name:var(--font-archivo)] text-[13px] tracking-wide">
                          {item.label}
                        </span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] px-1.5 py-0.5 rounded font-[family-name:var(--font-pixelify)] uppercase tracking-wider ${
                            isActive
                              ? 'bg-[#e3b341] text-[#111111] font-bold'
                              : 'bg-white/10 text-white/60 group-hover:bg-white/20'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>
      </div>

      {/* Footer de Perfil y Cierre de Sesión */}
      <div className="p-3 border-t border-white/10 bg-[#0a1024]">
        <div className="flex items-center justify-between p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-colors">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-lg bg-[#e3b341] text-[#111111] font-[family-name:var(--font-anton)] flex items-center justify-center text-sm font-bold shrink-0 shadow-sm">
              SA
            </div>
            <div className="min-w-0 flex flex-col">
              <span className="text-xs font-semibold text-white truncate font-[family-name:var(--font-archivo)]">
                Super Administrador
              </span>
              <span className="text-[10px] text-white/50 truncate font-mono">
                {userEmail}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            type="button"
            title="Cerrar sesión de Super Admin"
            className="p-1.5 text-white/40 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg transition-colors cursor-pointer"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
