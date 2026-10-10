/**
 * Pagination.ts — Estructura base para resultados paginados de colecciones.
 */
export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
