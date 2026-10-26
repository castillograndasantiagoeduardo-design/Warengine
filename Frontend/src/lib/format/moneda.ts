/**
 * moneda.ts — Formateo de montos en pesos colombianos (COP).
 */

const COP = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  maximumFractionDigits: 0,
});

const COP_COMPACTO = new Intl.NumberFormat('es-CO', {
  style: 'currency',
  currency: 'COP',
  notation: 'compact',
  maximumFractionDigits: 1,
});

const NUMERO = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 0 });

const PORCENTAJE = new Intl.NumberFormat('es-CO', { maximumFractionDigits: 1 });

/** $ 1.250.000 */
export function formatCOP(valor: number | null | undefined): string {
  return COP.format(Number(valor ?? 0));
}

/** $ 1,3 M — para ejes de gráficos y tarjetas pequeñas. */
export function formatCOPCompacto(valor: number | null | undefined): string {
  return COP_COMPACTO.format(Number(valor ?? 0));
}

/** 12.345 */
export function formatNumero(valor: number | null | undefined): string {
  return NUMERO.format(Number(valor ?? 0));
}

/** 23,5 % — recibe el porcentaje ya calculado (23.5), no la fracción. */
export function formatPorcentaje(valor: number | null | undefined): string {
  return `${PORCENTAJE.format(Number(valor ?? 0))} %`;
}
