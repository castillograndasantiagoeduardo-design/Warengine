import { Context } from 'hono';
import { getConnInfo } from 'hono/deno';

/**
 * IP de la conexión TCP. Deliberadamente NO se lee X-Forwarded-For: cualquier cliente puede
 * falsificar esa cabecera y ensuciaría la auditoría. Si algún día hay un proxy inverso,
 * hay que configurarlo aquí de forma explícita (lista de proxies de confianza).
 */
export function obtenerIp(c: Context): string | null {
  try {
    return getConnInfo(c).remote.address ?? null;
  } catch {
    return null;
  }
}