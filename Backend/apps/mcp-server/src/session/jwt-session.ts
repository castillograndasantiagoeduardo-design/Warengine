import type { IncomingMessage } from 'node:http';
import { DomainError, Result } from '@warengine/shared-kernel';
import { TokenInvalidoError } from '@warengine/core';
import type { AppContainer } from '@warengine/composition';
import type { McpSessionContext } from './session.types.ts';

/**
 * Extrae el token JWT de la petición entrante, considerando:
 * 1. Cabecera 'Authorization: Bearer <token>'
 * 2. Parámetro query '?token=<token>' (estándar para EventSource / SSE en navegadores)
 * 3. Cookie 'accessToken'
 */
export function extraerTokenDeRequest(req: IncomingMessage): string | null {
  // 1. Cabecera Authorization
  const authHeader = req.headers['authorization'];
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const token = authHeader.substring(7).trim();
    if (token) return token;
  }

  // 2. Query param ?token=... (común en conexiones SSE de browsers)
  if (req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      const tokenQuery = url.searchParams.get('token');
      if (tokenQuery && tokenQuery.trim()) {
        return tokenQuery.trim();
      }
    } catch (_e) {
      // URL no válida; continuar con la siguiente estrategia
    }
  }

  // 3. Cookie accessToken
  const cookieHeader = req.headers['cookie'];
  if (cookieHeader) {
    const cookies = cookieHeader.split(';').map((c) => c.trim());
    for (const cookie of cookies) {
      if (cookie.startsWith('accessToken=')) {
        const val = cookie.substring('accessToken='.length).trim();
        if (val) return val;
      }
    }
  }

  return null;
}

/**
 * Valida la identidad y credenciales del usuario a través del token JWT (RF-SA-I7 / RF-SA-I11).
 * Comprueba expiración, firma, revocación en base de datos y resuelve el alcance de sucursal.
 */
export async function validarSesionJwtMcp(
  req: IncomingMessage,
  sessionId: string,
  container: AppContainer,
): Promise<Result<McpSessionContext, DomainError>> {
  const token = extraerTokenDeRequest(req);
  if (!token) {
    return Result.fail(
      new TokenInvalidoError('No se proporcionó token de autenticación para la sesión MCP.'),
    );
  }

  // 1. Valida el token con ValidarPermisoUseCase (valida expiración y tokens_invalidados_en en BD)
  const validacionResult = await container.autenticacion.validarPermiso.execute({
    accessToken: token,
  });

  if (validacionResult.isFailure) {
    return Result.fail(validacionResult.error);
  }

  const identidad = validacionResult.value;

  // 2. Resuelve el alcance de sucursal asignado en tiempo real desde la BD (RNF-ADM-04)
  const alcanceResult = await container.autenticacion.resolverAlcanceSucursal.execute({
    usuarioId: identidad.usuarioId,
  });

  let sucursalId: number | null = null;
  let sucursalesPermitidas: number[] | undefined = undefined;
  let esGlobal = false;

  if (alcanceResult.isSuccess) {
    const alcance = alcanceResult.value;
    esGlobal = alcance.esGlobal;
    sucursalesPermitidas = alcance.sucursalesPermitidas();
    // La sucursal por defecto será la primera permitida si es alcance limitado
    if (!esGlobal && sucursalesPermitidas && sucursalesPermitidas.length > 0) {
      sucursalId = sucursalesPermitidas[0];
    }
  }

  const contexto: McpSessionContext = {
    usuarioId: identidad.usuarioId,
    rolId: identidad.rolId,
    sucursalId,
    sucursalesPermitidas,
    esGlobal,
    permisos: identidad.permisos,
    sessionId,
    actor: {
      usuarioId: identidad.usuarioId,
      ip: null,
      permisos: identidad.permisos,
    },
    createdAt: new Date(),
  };

  return Result.ok(contexto);
}
