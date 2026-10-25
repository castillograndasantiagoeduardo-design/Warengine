'use client';

/**
 * useAuth.ts — Hook principal para acceder al estado y acciones de autenticación.
 *
 * Principio SOLID:
 * - Single Responsibility: Proporciona una interfaz unificada y reactiva para
 *   interactuar con la sesión en cualquier componente de React.
 */

import { useAuthContext } from '../context/AuthContext';

export function useAuth() {
  return useAuthContext();
}
