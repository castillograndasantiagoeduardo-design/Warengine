// Roles del sistema Warengine.
// Estos valores deben coincidir exactamente con los registrados en la tabla `roles` de la BD.

export const ROLES = {
  SUPER_ADMIN: 'super-admin',
  ADMIN_SUCURSAL: 'admin-sucursal',
  CAJERO: 'cajero',
  VENDEDOR_B2B: 'vendedor-b2b',
} as const;

export type Role = (typeof ROLES)[keyof typeof ROLES];

