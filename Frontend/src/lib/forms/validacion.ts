/**
 * validacion.ts — Traducción de errores de validación (Zod local o API) a errores por campo.
 *
 * Se usa un tipo estructural (EsquemaValidable) en lugar de importar zod, porque
 * @warengine/contracts trae su propia versión de zod: así cualquier esquema del
 * paquete encaja sin acoplar versiones.
 */

import { ApiError } from '@/lib/api';

export interface IssueValidacion {
  path: PropertyKey[];
  message: string;
}

export type ResultadoValidacion<O> =
  | { success: true; data: O }
  | { success: false; error: { issues: IssueValidacion[] } };

export interface EsquemaValidable<O> {
  safeParse(valor: unknown): ResultadoValidacion<O>;
}

export type ErroresCampo = Record<string, string | undefined>;

/** Primer mensaje por campo (path[0]). Los issues sin path quedan en la clave '_form'. */
export function erroresDesdeIssues(issues: IssueValidacion[]): ErroresCampo {
  const errores: ErroresCampo = {};
  for (const issue of issues) {
    const campo = issue.path.length > 0 ? String(issue.path[0]) : '_form';
    if (!errores[campo]) errores[campo] = issue.message;
  }
  return errores;
}

/**
 * Mensaje legible para cualquier error de la API.
 * `mensajesPorCodigo` permite personalizar códigos de dominio (ej. SUCURSAL_DUPLICADA).
 */
export function mensajeDeError(error: unknown, mensajesPorCodigo: Record<string, string> = {}): string {
  if (error instanceof ApiError) {
    if (mensajesPorCodigo[error.code]) return mensajesPorCodigo[error.code];
    if (error.isPermisoDenegado()) return 'No tienes permisos para realizar esta acción.';
    if (error.status === 0) return error.message;
    if (error.code === 'VALIDATION_ERROR') return 'Revisa los campos marcados.';
    return error.message;
  }
  return 'Ocurrió un error inesperado. Intenta de nuevo.';
}
