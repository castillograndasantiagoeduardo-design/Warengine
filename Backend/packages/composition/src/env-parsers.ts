/**
 * env-parsers.ts — Utilidades puras para parseo y validación de variables de entorno en composition.
 */

/**
 * Parsea una variable de entorno como un entero positivo (> 0).
 * Si no está definida o está vacía, devuelve el valor por defecto.
 * Si es inválida (negativa, cero, flotante, texto no numérico), lanza un error descriptivo.
 */
export function parseEnteroPositivo(
  valor: string | undefined,
  nombreVar: string,
  valorPorDefecto: number,
): number {
  if (valor === undefined || valor.trim() === '') {
    return valorPorDefecto;
  }
  const n = Number(valor);
  if (!Number.isInteger(n) || n <= 0) {
    throw new Error(
      `La variable de entorno ${nombreVar} debe ser un entero positivo. Valor recibido: "${valor}"`,
    );
  }
  return n;
}
