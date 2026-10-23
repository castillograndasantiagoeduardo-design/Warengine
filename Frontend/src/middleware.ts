import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * middleware.ts — Protección de rutas administrativas de WarEngine.
 * Exclusivo para Super Administrador (rolId === 1).
 */
function parseJwt(token: string): { rolId?: number; exp?: number; [key: string]: unknown } | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch {
    return null;
  }
}

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Proteger estrictamente todas las rutas bajo /admin
  if (pathname.startsWith('/admin')) {
    const token =
      request.cookies.get('warengine_access_token')?.value ||
      request.cookies.get('access_token')?.value;

    if (!token) {
      const loginUrl = new URL('/acceso', request.url);
      loginUrl.searchParams.set('error', 'unauthenticated');
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }

    const payload = parseJwt(token);

    if (!payload) {
      const loginUrl = new URL('/acceso', request.url);
      loginUrl.searchParams.set('error', 'invalid_token');
      return NextResponse.redirect(loginUrl);
    }

    // Verificar si el token expiró
    if (payload.exp && payload.exp * 1000 < Date.now()) {
      const loginUrl = new URL('/acceso', request.url);
      loginUrl.searchParams.set('error', 'session_expired');
      return NextResponse.redirect(loginUrl);
    }

    // Verificar que sea exclusivamente Super Administrador (rolId: 1)
    if (payload.rolId !== 1) {
      const loginUrl = new URL('/acceso', request.url);
      loginUrl.searchParams.set('error', 'unauthorized_super_admin_only');
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};

