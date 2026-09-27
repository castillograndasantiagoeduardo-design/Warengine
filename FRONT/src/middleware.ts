import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * middleware.ts — Protección de rutas según cookie de sesión y rol.
 *
 * Responsabilidades:
 *  1. Leer la cookie de sesión (JWT de acceso).
 *  2. Verificar que la ruta requerida esté permitida para el rol del usuario.
 *  3. Redirigir a /iniciar-sesion si no hay sesión válida.
 *  4. Redirigir a /no-autorizado si el rol no tiene permiso para la ruta.
 *
 * PROHIBIDO: lógica de negocio, consultas a la BD, llamadas al backend.
 * Solo lee la cookie y decide si redirige o deja pasar.
 */

export function middleware(_request: NextRequest) {
  // TODO: implementar cuando se desarrolle el módulo de autenticación.
  return NextResponse.next();
}

export const config = {
  // Aplica el middleware a todas las rutas excepto las estáticas y de imagen.
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
