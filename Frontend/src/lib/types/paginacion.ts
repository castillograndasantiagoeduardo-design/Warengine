/**
 * paginacion.ts — Tipo de respuesta paginada unificado para el Frontend.
 *
 * La API usa dos formas distintas según el módulo:
 * - shared-kernel ResultadoPaginado: { items, total, page, limit, totalPages }  (ej. /alertas-stock)
 * - Auditoría:                       { items, total, pagina, limite, totalPaginas }
 * normalizarPaginado() convierte cualquiera de las dos (o un arreglo plano) a Paginado<T>.
 */

export interface Paginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

interface PaginadoEs<T> {
  items: T[];
  total: number;
  pagina: number;
  limite: number;
  totalPaginas: number;
}

export type RespuestaListado<T> = T[] | Paginado<T> | PaginadoEs<T>;

export function normalizarPaginado<T>(raw: RespuestaListado<T>): Paginado<T> {
  if (Array.isArray(raw)) {
    return { items: raw, total: raw.length, page: 1, limit: raw.length || 1, totalPages: 1 };
  }
  if ('pagina' in raw) {
    return { items: raw.items, total: raw.total, page: raw.pagina, limit: raw.limite, totalPages: raw.totalPaginas };
  }
  return raw;
}

export function esPaginado<T>(raw: RespuestaListado<T>): raw is Paginado<T> | PaginadoEs<T> {
  return !Array.isArray(raw);
}
