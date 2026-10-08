import { Context } from 'hono';

/** Envuelve un controlador para devolver 500 uniforme ante errores inesperados. */
export function safeHandler(fn: (c: Context) => Promise<Response>) {
  return async (c: Context) => {
    try {
      return await fn(c);
    } catch (_e) {
      return c.json({ error: 'INTERNAL_ERROR', message: 'Error procesando la solicitud' }, 500);
    }
  };
}

/** Lee el body JSON; si es inválido devuelve null para que Zod responda 400. */
export async function leerJson(c: Context): Promise<unknown> {
  try {
    return await c.req.json();
  } catch {
    return null;
  }
}