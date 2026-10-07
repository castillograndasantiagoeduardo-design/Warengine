/**
 * validar-permiso-identidad.use-case.test.ts — ValidarPermisoUseCase devuelve la identidad
 * del usuario autenticado (la usan la auditoría y el alcance por sucursal).
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  AccessTokenPayload,
  IAuditor,
  IRolRepository,
  ITokenService,
  IUsuarioRepository,
  Usuario,
  ValidarPermisoUseCase,
} from '../../mod.ts';

function tokenService(payload: AccessTokenPayload): ITokenService {
  return {
    generarTokens: () => Promise.resolve({ accessToken: '', refreshToken: '' }),
    validarAccessToken: () => Promise.resolve(payload),
    validarRefreshToken: () => Promise.resolve({ usuarioId: payload.usuarioId }),
    revocarRefreshToken: () => Promise.resolve(),
  };
}

function usuarios(usuario: Usuario | null): IUsuarioRepository {
  return {
    findByEmail: () => Promise.resolve(usuario),
    findById: () => Promise.resolve(usuario),
  };
}

function roles(permisos: string[]): IRolRepository {
  return { obtenerPermisosDeRol: () => Promise.resolve(permisos) };
}

const mockAuditor: IAuditor = {
  registrar: () => Promise.resolve(),
};

const payload: AccessTokenPayload = {
  usuarioId: 'uuid-007',
  rolId: 2,
  iat: new Date('2026-01-01T00:00:00Z'),
};

Deno.test('ValidarPermisoUseCase: devuelve usuarioId y rolId tomados de la BD, no del token', async () => {
  // El rol vigente en BD (1) manda sobre el rol que traía el token (2).
  const usuario = new Usuario('uuid-007', 'a@warengine.local', 'hash', 1, true, false, null);
  const useCase = new ValidarPermisoUseCase(
    tokenService(payload),
    usuarios(usuario),
    roles(['administracion:gestionar-sucursales']),
    mockAuditor,
  );

  const result = await useCase.execute({
    accessToken: 'ok',
    permisoRequerido: 'administracion:gestionar-sucursales',
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value, { usuarioId: 'uuid-007', rolId: 1 });
});

Deno.test('ValidarPermisoUseCase: devuelve la identidad aunque no se exija un permiso', async () => {
  const usuario = new Usuario('uuid-007', 'a@warengine.local', 'hash', 2, true, false, null);
  const useCase = new ValidarPermisoUseCase(
    tokenService(payload),
    usuarios(usuario),
    roles([]),
    mockAuditor,
  );

  const result = await useCase.execute({ accessToken: 'ok' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.usuarioId, 'uuid-007');
});