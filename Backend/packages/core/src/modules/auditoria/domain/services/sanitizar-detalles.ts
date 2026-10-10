const PATRON_SENSIBLE = /pass|clave|hash|token|secret|totp|otp/i;
const PROFUNDIDAD_MAXIMA = 5;

/**
 * Sanitiza recursivamente objetos y arrays para eliminar datos sensibles antes de persistir
 * en el log de auditoría.
 *
 * - No muta el objeto original.
 * - Reemplaza valores con '[REDACTADO]' cuando la clave coincide con el patrón sensible.
 * - Límite de profundidad máxima de 5 niveles para prevenir recursión infinita.
 * - Devuelve null si recibe null o undefined.
 */
export function sanitizarDetalles(
  detalles?: Record<string, unknown> | null,
  profundidad = 0,
): Record<string, unknown> | null {
  if (detalles === null || detalles === undefined) {
    return null;
  }

  if (typeof detalles !== 'object') {
    return detalles;
  }

  if (profundidad >= PROFUNDIDAD_MAXIMA) {
    return '[PROFUNDIDAD_MAXIMA_EXCEDIDA]' as unknown as Record<string, unknown>;
  }

  if (Array.isArray(detalles)) {
    return detalles.map((item) => sanitizarValor(item, profundidad + 1)) as unknown as Record<
      string,
      unknown
    >;
  }

  const copia: Record<string, unknown> = {};

  for (const [clave, valor] of Object.entries(detalles)) {
    if (PATRON_SENSIBLE.test(clave)) {
      copia[clave] = '[REDACTADO]';
    } else if (valor !== null && typeof valor === 'object') {
      copia[clave] = sanitizarValor(valor, profundidad + 1);
    } else {
      copia[clave] = valor;
    }
  }

  return copia;
}

function sanitizarValor(valor: unknown, profundidad: number): unknown {
  if (valor === null || valor === undefined) {
    return valor;
  }
  if (profundidad >= PROFUNDIDAD_MAXIMA) {
    return '[PROFUNDIDAD_MAXIMA_EXCEDIDA]';
  }
  if (Array.isArray(valor)) {
    return valor.map((item) => sanitizarValor(item, profundidad + 1));
  }
  if (typeof valor === 'object') {
    const objCopia: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(valor as Record<string, unknown>)) {
      if (PATRON_SENSIBLE.test(k)) {
        objCopia[k] = '[REDACTADO]';
      } else if (v !== null && typeof v === 'object') {
        objCopia[k] = sanitizarValor(v, profundidad + 1);
      } else {
        objCopia[k] = v;
      }
    }
    return objCopia;
  }
  return valor;
}
