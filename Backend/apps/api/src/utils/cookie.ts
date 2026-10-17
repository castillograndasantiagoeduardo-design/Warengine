import { Context } from 'hono';
import { setCookie, deleteCookie, getCookie } from 'hono/cookie';

// El atributo secure debe ser true salvo que NODE_ENV sea explícitamente 'development' (RF-SA-D2).
const isSecure = Deno.env.get('NODE_ENV') !== 'development';

export const COOKIE_NAMES = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
} as const;

export function setAuthCookies(
  c: Context,
  tokens: { accessToken: string; refreshToken: string },
  recordarme = false,
): void {
  // Access Token Cookie (15 minutos)
  setCookie(c, COOKIE_NAMES.ACCESS_TOKEN, tokens.accessToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: 15 * 60, // 900s = 15 minutos
  });

  // Refresh Token Cookie (RF-SA-G4: 30 días si recordarme es true, 7 días si false)
  const refreshMaxAge = recordarme ? 30 * 24 * 60 * 60 : 7 * 24 * 60 * 60;
  setCookie(c, COOKIE_NAMES.REFRESH_TOKEN, tokens.refreshToken, {
    httpOnly: true,
    secure: isSecure,
    sameSite: 'Lax',
    path: '/',
    maxAge: refreshMaxAge,
  });
}

export function clearAuthCookies(c: Context): void {
  deleteCookie(c, COOKIE_NAMES.ACCESS_TOKEN, {
    path: '/',
    secure: isSecure,
    sameSite: 'Lax',
  });
  deleteCookie(c, COOKIE_NAMES.REFRESH_TOKEN, {
    path: '/',
    secure: isSecure,
    sameSite: 'Lax',
  });
}

export function getTokensFromCookies(c: Context): {
  accessToken?: string;
  refreshToken?: string;
} {
  return {
    accessToken: getCookie(c, COOKIE_NAMES.ACCESS_TOKEN),
    refreshToken: getCookie(c, COOKIE_NAMES.REFRESH_TOKEN),
  };
}
