/**
 * rol.ts — Etiqueta legible de un rol (solo presentación; nunca para autorizar).
 */

const ETIQUETAS: Record<string, string> = {
  'super-admin': 'Super Admin',
  'admin-sucursal': 'Admin de sucursal',
  cajero: 'Cajero',
  'vendedor-b2b': 'Vendedor B2B',
};

export function etiquetaRol(nombre: string | null | undefined): string {
  if (!nombre) return '';
  return ETIQUETAS[nombre] ?? nombre;
}
