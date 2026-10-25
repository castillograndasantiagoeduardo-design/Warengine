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
    pathname.startsWith('/dashboard') ||
    pathname.startsWith('/pos') ||
    pathname.startsWith('/administracion') ||
    pathname.startsWith('/inventario') ||
    pathname.startsWith('/ventas') ||
    pathname.startsWith('/logistica');

  const esRutaAutenticacion = pathname === '/acceso' || pathname === '/iniciar-sesion';

  // 1. Caso: Usuario sin sesión intenta entrar a ruta protegida
  if (esRutaProtegida && !tieneSesion) {
    const url = new URL('/acceso', request.url);
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  // 2. Caso: Usuario con sesión activa intenta visitar la pantalla de acceso/login
  if (esRutaAutenticacion && tieneSesion) {
    // Redirigir al POS si es cajero (rolId: 3) o al dashboard si es otro rol
    if (payload?.rolId === 3) {
      return NextResponse.redirect(new URL('/pos', request.url));
    }
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // 3. Caso: Cajero intentando entrar al panel administrativo o viceversa
  if (tieneSesion && payload?.rolId) {
    if (pathname.startsWith('/dashboard') && payload.rolId === 3) {
      // Cajero redirigido a su terminal POS
      return NextResponse.redirect(new URL('/pos', request.url));
    }

    if (pathname.startsWith('/pos') && payload.rolId !== 3 && payload.rolId !== 1) {
      // Administrador que no es cajero ni super-admin redirigido a su panel
      return NextResponse.redirect(new URL('/dashboard', request.url));
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
