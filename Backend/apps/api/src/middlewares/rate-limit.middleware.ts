import { Context, Next } from 'hono';
import { obtenerIp } from '../utils/ip.ts';

interface RateLimitOptions {
  ventanaMs: number;
  maxPeticiones: number;
  mensaje?: string;
}

interface RegistroIp {
  timestamps: number[];
}

export function createIpRateLimiter(options: RateLimitOptions) {
  const {
    ventanaMs,
    maxPeticiones,
    mensaje = 'Demasiadas solicitudes desde esta dirección IP. Por favor espera antes de intentar nuevamente.',
  } = options;

  const registros = new Map<string, RegistroIp>();

  // Limpieza periódica cada 5 minutos
  const interval = setInterval(() => {
    const ahora = Date.now();
    for (const [ip, reg] of registros.entries()) {
      reg.timestamps = reg.timestamps.filter((t) => ahora - t < ventanaMs);
      if (reg.timestamps.length === 0) {
        registros.delete(ip);
      }
    }
  }, 5 * 60 * 1000);

  // En Deno unref evita retener el proceso abierto
  if (typeof (interval as unknown as { unref?: () => void }).unref === 'function') {
    (interval as unknown as { unref: () => void }).unref();
  }

  return async (c: Context, next: Next) => {
    const ip = obtenerIp(c) || 'desconocida';
    const ahora = Date.now();

    let reg = registros.get(ip);
    if (!reg) {
      reg = { timestamps: [] };
      registros.set(ip, reg);
    }

    // Filtrar solicitudes fuera de la ventana
    reg.timestamps = reg.timestamps.filter((t) => ahora - t < ventanaMs);

    if (reg.timestamps.length >= maxPeticiones) {
      const masAntiguo = reg.timestamps[0];
      const esperarSegundos = Math.ceil((ventanaMs - (ahora - masAntiguo)) / 1000);

      c.header('Retry-After', String(esperarSegundos));
      return c.json(
        {
          error: 'RATE_LIMIT_EXCEDIDO',
          message: mensaje,
          segundosRestantes: esperarSegundos,
        },
        429,
      );
    }

    reg.timestamps.push(ahora);
    await next();
  };
}
