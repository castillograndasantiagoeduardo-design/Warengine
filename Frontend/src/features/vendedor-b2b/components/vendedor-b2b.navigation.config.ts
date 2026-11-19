/**
 * vendedor-b2b.navigation.config.ts — Configuración centralizada y declarativa
 * de navegación del módulo Vendedor B2B.
 */

export type VendedorB2BNavCategory = 'MENÚ' | 'OPERACIONES' | 'SISTEMA';

export type VendedorB2BNavIconName =
  | 'catalogo'
  | 'cotizaciones'
  | 'historial'
  | 'panel';

export interface VendedorB2BNavItemConfig {
  id: string;
  label: string;
  href?: string;
  action?: 'cotizaciones' | 'historial' | 'panel';
  icon: VendedorB2BNavIconName;
  categoria: VendedorB2BNavCategory;
  /** Si es true, la ruta se marca activa solo en coincidencia exacta. */
  exact?: boolean;
}

export const VENDEDOR_B2B_NAV_CATEGORIES: readonly VendedorB2BNavCategory[] = [
  'MENÚ',
  'OPERACIONES',
  'SISTEMA',
] as const;

export const VENDEDOR_B2B_NAV_ITEMS: readonly VendedorB2BNavItemConfig[] = [
  // MENÚ
  {
    id: 'catalogo',
    label: 'Catálogo B2B',
    href: '/vendedor-b2b',
    icon: 'catalogo',
    categoria: 'MENÚ',
    exact: true,
  },
  // OPERACIONES
  {
    id: 'cotizaciones',
    label: 'Mis cotizaciones',
    action: 'cotizaciones',
    icon: 'cotizaciones',
    categoria: 'OPERACIONES',
  },
  {
    id: 'historial',
    label: 'Historial de facturas',
    action: 'historial',
    icon: 'historial',
    categoria: 'OPERACIONES',
  },
  // SISTEMA
  {
    id: 'panel',
    label: 'Panel principal',
    href: '/dashboard',
    action: 'panel',
    icon: 'panel',
    categoria: 'SISTEMA',
  },
] as const;

/**
 * Determina si un ítem del sidebar está activo según el pathname actual.
 */
export function isVendedorB2BRouteActive(
  pathname: string,
  href?: string,
  exact = false,
): boolean {
  if (!href) return false;
  const cleanPath = pathname.replace(/\/+$/, '') || '/';
  const cleanHref = href.replace(/\/+$/, '') || '/';

  if (exact || cleanHref === '/vendedor-b2b') {
    return cleanPath === cleanHref;
  }
  return cleanPath === cleanHref || cleanPath.startsWith(`${cleanHref}/`);
}
