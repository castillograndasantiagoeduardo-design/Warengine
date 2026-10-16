/**
 * Utilidad pura de generación de CSV conforme a RFC 4180.
 * Incluye BOM UTF-8 (\uFEFF) para compatibilidad nativa con Microsoft Excel.
 */

export interface OpcionesGenerarCsv {
  delimitador?: ',' | ';';
  incluirBom?: boolean;
}

/**
 * Escapa un valor individual para una celda CSV.
 * Si contiene el delimitador, comillas dobles o saltos de línea, se envuelve entre comillas dobles
 * y se duplican las comillas internas.
 */
export function escaparCampoCsv(
  valor: unknown,
  delimitador: string = ',',
): string {
  if (valor === null || valor === undefined) {
    return '';
  }

  const str = String(valor);

  const necesitaComillas =
    str.includes(delimitador) ||
    str.includes('"') ||
    str.includes('\n') ||
    str.includes('\r');

  if (necesitaComillas) {
    return `"${str.replaceAll('"', '""')}"`;
  }

  return str;
}

/**
 * Convierte un array de encabezados y una matriz de filas en un string CSV.
 */
export function generarCsv(
  encabezados: string[],
  filas: (unknown)[][],
  opciones: OpcionesGenerarCsv = {},
): string {
  const delimitador = opciones.delimitador ?? ',';
  const incluirBom = opciones.incluirBom ?? true;

  const lineaEncabezados = encabezados
    .map((h) => escaparCampoCsv(h, delimitador))
    .join(delimitador);

  const lineasFilas = filas.map((fila) =>
    fila.map((celda) => escaparCampoCsv(celda, delimitador)).join(delimitador),
  );

  const cuerpo = [lineaEncabezados, ...lineasFilas].join('\r\n');

  return incluirBom ? `\uFEFF${cuerpo}` : cuerpo;
}
