import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * middleware.ts — Protección perimetral de rutas según cookies HttpOnly y rol del usuario.
 *
 * Principio SOLID:
 * - Single Responsibility: Controla exclusivamente las redirecciones de acceso perimetral
 *   en el Edge sin invocar consultas de base de datos ni lógica de negocio.
 *
 * Seguridad:
 * - Lee las cookies HttpOnly (access_token y refresh_token).
 * - Protege rutas privadas (/dashboard, /pos) contra accesos no autenticados.
 * - Redirige automáticamente a usuarios con sesión activa que visiten /acceso hacia su zona de trabajo.
 */

interface JwtPayload {
  usuarioId?: string;
  rolId?: number;
  exp?: number;
}

/**
 * Decodifica de forma segura y liviana el payload Base64URL del JWT en el Edge Runtime.
 */
function decodeJwt(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;

    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const binary = atob(base64);
    const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
    const decoded = new TextDecoder().decode(bytes);
    return JSON.parse(decoded) as JwtPayload;
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const accessTokenCookie = request.cookies.get('access_token')?.value;
  const refreshTokenCookie = request.cookies.get('refresh_token')?.value;

  const payload = accessTokenCookie ? decodeJwt(accessTokenCookie) : null;
  const accessTokenValido = Boolean(
    payload && payload.exp && payload.exp * 1000 > Date.now(),
  );

  // Hay sesión si el access_token no ha expirado o si existe refresh_token disponible para rotar
  const tieneSesion = accessTokenValido || Boolean(refreshTokenCookie);

  const esRutaProtegida =
    pathname.startsWith('/admin-sucursal') ||
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/pos') ||
    pathname.startsWith('/administracion') ||
    pathname.startsWith('/inventario') ||
    pathname.startsWith('/ventas') ||
    pathname.startsWith('/logistica');

  // 1. Caso: Usuario sin sesión intenta entrar a ruta protegida
  if (esRutaProtegida && !tieneSesion) {
    const url = new URL('/acceso', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Redirección de compatibilidad: /dashboard redirige a /admin-sucursal
  if (pathname.startsWith('/dashboard')) {
    if (payload?.rolId === 2) {
      return NextResponse.redirect(new URL('/admin-sucursal', request.url));
    }
  }

  // 3. Control de acceso granular por rol (RBAC perimetral)
  if (tieneSesion && payload?.rolId) {
    // El panel de sucursal (/admin-sucursal) es exclusivo para Administradores de Sucursal (rolId: 2)
    if (pathname.startsWith('/admin-sucursal') && payload.rolId !== 2) {
      if (payload.rolId === 3) {
        // Cajero redirigido a su terminal POS
        return NextResponse.redirect(new URL('/pos', request.url));
      }
      if (payload.rolId === 1) {
        // Super-admin redirigido a su panel general
        return NextResponse.redirect(new URL('/dashboard', request.url));
      }
      // Cualquier otro rol no autorizado para el panel de sucursal
      const url = new URL('/acceso', request.url);
      url.searchParams.set('error', 'acceso_denegado_sucursal');
      return NextResponse.redirect(url);
    }

    if (pathname.startsWith('/pos') && payload.rolId !== 3 && payload.rolId !== 1) {
      // Si un admin-sucursal visita /pos, redirigir a su panel /admin-sucursal
      if (payload.rolId === 2) {
        return NextResponse.redirect(new URL('/admin-sucursal', request.url));
      }
    }
  }

  return NextResponse.next();
}

export const config = {
  // Aplica a todas las rutas excepto archivos estáticos, imágenes y favicon
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
