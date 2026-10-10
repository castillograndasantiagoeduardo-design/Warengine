/**
 * mysql-error-translator.ts — Helper compartido para detección y traducción de errores de MySQL.
 *
 * Centraliza la inspección de errores de mysql2 / Drizzle (incluyendo error.cause)
 * para códigos frecuentes:
 *   - 1062: Clave duplicada (ER_DUP_ENTRY)
 *   - 1452: Clave foránea inexistente en inserción/actualización (ER_NO_REFERENCED_ROW_2)
 *   - 1451: Clave foránea referenciada en eliminación (ER_ROW_IS_REFERENCED_2)
 *   - 1644: Excepción lanzada por SIGNAL en trigger MySQL (ER_SIGNAL_EXCEPTION)
 *   - 3819: Violación de restricción CHECK (ER_CHECK_CONSTRAINT_VIOLATED)
 */

export const MYSQL_ERRNO = {
  CLAVE_DUPLICADA: 1062,
  FK_NO_REFERENCIADA: 1452,
  FK_REFERENCIADA_DELETE: 1451,
  SIGNAL_TRIGGER: 1644,
  CHECK_VIOLADO: 3819,
  DEADLOCK: 1213,
  LOCK_WAIT_TIMEOUT: 1205,
} as const;

interface MysqlErrorLike {
  errno?: number;
  code?: string;
  sqlMessage?: string;
  cause?: MysqlErrorLike;
}

/** Obtiene el errno de un error de mysql2, revisando si viene en la raíz o en error.cause. */
export function obtenerErrno(error: unknown): number | undefined {
  const e = error as MysqlErrorLike | undefined;
  return e?.errno ?? e?.cause?.errno;
}

/** Obtiene el mensaje SQL crudo devuelto por MySQL. */
export function obtenerSqlMessage(error: unknown): string | undefined {
  const e = error as MysqlErrorLike | undefined;
  return e?.sqlMessage ?? e?.cause?.sqlMessage;
}

/** Verifica si el error corresponde a una clave duplicada (errno 1062). */
export function esClaveDuplicada(error: unknown): boolean {
  return obtenerErrno(error) === MYSQL_ERRNO.CLAVE_DUPLICADA;
}

/** Verifica si el error corresponde a una clave foránea inexistente (errno 1452). */
export function esReferenciaInvalida(error: unknown): boolean {
  return obtenerErrno(error) === MYSQL_ERRNO.FK_NO_REFERENCIADA;
}

/** Verifica si el error corresponde a un SIGNAL de trigger (1644) o un CHECK fallido (3819). */
export function esViolacionCheckOTrigger(error: unknown): boolean {
  const errno = obtenerErrno(error);
  return errno === MYSQL_ERRNO.SIGNAL_TRIGGER || errno === MYSQL_ERRNO.CHECK_VIOLADO;
}

/** Evita que % y _ escritos por el usuario actúen como comodines de LIKE. */
export function escaparLike(texto: string): string {
  return texto.replace(/[\\%_]/g, '\\$&');
}
