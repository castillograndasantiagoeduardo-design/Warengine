import { Context } from 'hono';
import { IdentidadAutenticada } from '@warengine/core';

/** Clave con la que authMiddleware guarda la identidad en el contexto de Hono. */
export const CLAVE_IDENTIDAD = 'identidad';

/**
 * Devuelve la identidad del usuario autenticado.
 * Solo debe llamarse en rutas protegidas por authMiddleware; si falta, es un error
 * de programación (ruta sin middleware) y se lanza para que safeHandler responda 500.
 */
export function obtenerIdentidad(c: Context): IdentidadAutenticada {
  const identidad = c.get(CLAVE_IDENTIDAD) as IdentidadAutenticada | undefined;
  if (!identidad) {
    throw new Error('obtenerIdentidad() llamado en una ruta sin authMiddleware.');
  }
  return identidad;
}