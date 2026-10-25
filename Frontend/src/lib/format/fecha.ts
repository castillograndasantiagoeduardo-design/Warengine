/**
 * fecha.ts — Formateo de fechas para la zona horaria de Colombia y helpers de rangos.
 */

const ZONA = 'America/Bogota';

const FECHA = new Intl.DateTimeFormat('es-CO', { timeZone: ZONA, day: '2-digit', month: 'short', year: 'numeric' });

const FECHA_HORA = new Intl.DateTimeFormat('es-CO', {
  timeZone: ZONA,
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

function aDate(valor: string | Date | null | undefined): Date | null {
  if (!valor) return null;
  // 'YYYY-MM-DD' se interpreta como fecha local (no UTC) para no correr el día
  const fecha = typeof valor === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T12:00:00`) : new Date(valor);
  return Number.isNaN(fecha.getTime()) ? null : fecha;
}

/** 25 oct 2026 */
export function formatFecha(valor: string | Date | null | undefined): string {
  const fecha = aDate(valor);
  return fecha ? FECHA.format(fecha) : '—';
}

/** 25 oct 2026, 08:30 p. m. */
export function formatFechaHora(valor: string | Date | null | undefined): string {
  const fecha = aDate(valor);
  return fecha ? FECHA_HORA.format(fecha) : '—';
}

/** Date → 'YYYY-MM-DD' en hora local (para inputs type="date" y fechaEfectiva). */
export function aFechaISO(fecha: Date = new Date()): string {
  const y = fecha.getFullYear();
  const m = String(fecha.getMonth() + 1).padStart(2, '0');
  const d = String(fecha.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export interface RangoFechas {
  desde: string;
  hasta: string;
}

/** Rango [hoy - (dias - 1), hoy] completo, como ISO 8601 (lo que esperan los query params de la API). */
export function rangoUltimosDias(dias: number): RangoFechas {
  const hasta = new Date();
  hasta.setHours(23, 59, 59, 999);
  const desde = new Date();
  desde.setDate(desde.getDate() - (dias - 1));
  desde.setHours(0, 0, 0, 0);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}

/** Rango desde el día 1 del mes actual hasta hoy. */
export function rangoMesActual(): RangoFechas {
  const hasta = new Date();
  hasta.setHours(23, 59, 59, 999);
  const desde = new Date(hasta.getFullYear(), hasta.getMonth(), 1);
  return { desde: desde.toISOString(), hasta: hasta.toISOString() };
}
