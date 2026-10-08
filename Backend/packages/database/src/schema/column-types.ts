import { customType } from 'drizzle-orm/mysql-core';

/**
 * varcharBin — Define una columna VARCHAR con collation utf8mb4_bin.
 *
 * Se utiliza en columnas que requieren comparación byte a byte exacta
 * (hashes Argon2, tokens, secretos TOTP, códigos de permisos y números de documento),
 * evitando coincidencias insensibles a mayúsculas o acentos de la intercalación por defecto.
 */
export const varcharBin = customType<{ data: string; config: { length: number } }>({
  dataType(config) {
    return `varchar(${config?.length ?? 255}) collate utf8mb4_bin`;
  },
});
