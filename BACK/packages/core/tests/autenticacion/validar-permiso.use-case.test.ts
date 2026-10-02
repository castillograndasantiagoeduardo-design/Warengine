/**
 * validar-permiso.use-case.test.ts — Pruebas unitarias del ValidarPermisoUseCase.
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ValidarPermisoUseCase,
  IUsuarioRepository,
  IRolRepository,
  ITokenService,
  AuthTokens,
  AccessTokenPayload,
  Usuario,
} from '../../mod.ts';

// ─── Factories de mocks ──────────────────────────────────────────────────────

function makePayload(overrides: Partial<AccessTokenPayload> = {}): AccessTokenPayload {
  return {
    usuarioId: overrides.usuarioId ?? 'uuid-001',
    rolId: overrides.rolId ?? 1,
    iat: overrides.iat ?? new Date('2026-01-01T00:00:00Z'),
  };
}

function makeTokenService(payload: AccessTokenPayload, failValidation = false): ITokenService {
  return {
    generarTokens: (_id: string, _rolId: number): Promise<AuthTokens> =>
      Promise.resolve({ accessToken: '', refreshToken: '' }),
    validarAccessToken: (_t: string) => {
      if (failValidation) return Promise.reject(new Error('Token inválido'));
      return Promise.resolve(payload);
    },
    validarRefreshToken: (_t: string) => Promise.resolve({ usuarioId: payload.usuarioId }),
    revocarRefreshToken: (_t: string) => Promise.resolve(),
  };
}

function makeUsuario(invalidadoEn: Date | null = null): Usuario {
  return new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, true, false, invalidadoEn);
}

function makeUsuarioRepository(usuario: Usuario | null): IUsuarioRepository {
  return {
    findByEmail: (_email: string) => Promise.resolve(usuario),
    findById: (_id: string) => Promise.resolve(usuario),
  };
}

function makeRolRepository(permisos: string[]): IRolRepository {
  return {
    obtenerPermisosDeRol: (_rolId: number) => Promise.resolve(permisos),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('ValidarPermisoUseCase: aprueba si el usuario tiene el permiso requerido', async () => {
  const payload = makePayload();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(makeUsuario()),
    makeRolRepository(['facturacion:facturar', 'inventario:leer'])
  );

  const result = await useCase.execute({ accessToken: 'valid_token', permisoRequerido: 'facturacion:facturar' });

  assertEquals(result.isSuccess, true);
});

Deno.test('ValidarPermisoUseCase: rechaza con PERMISO_DENEGADO si el rol no tiene el permiso', async () => {
  const payload = makePayload();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(makeUsuario()),
    makeRolRepository(['inventario:leer']) // no incluye facturacion:facturar
  );

  const result = await useCase.execute({ accessToken: 'valid_token', permisoRequerido: 'facturacion:facturar' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'PERMISO_DENEGADO');
});

Deno.test('ValidarPermisoUseCase: rechaza con TOKEN_INVALIDO si el JWT es inválido', async () => {
  const payload = makePayload();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload, true), // simula token inválido
    makeUsuarioRepository(makeUsuario()),
    makeRolRepository([])
  );

  const result = await useCase.execute({ accessToken: 'bad_token', permisoRequerido: 'inventario:leer' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'TOKEN_INVALIDO');
});

Deno.test('ValidarPermisoUseCase: rechaza con TOKEN_INVALIDO si las credenciales fueron invalidadas', async () => {
  // Token emitido ANTES de que se invalidaran las credenciales
  const fechaInvalidacion = new Date('2026-06-01T12:00:00Z');
  const tokenIat          = new Date('2026-06-01T10:00:00Z'); // más antiguo → inválido

  const payload = makePayload({ iat: tokenIat });
  const usuarioConInvalidacion = makeUsuario(fechaInvalidacion);

  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(usuarioConInvalidacion),
    makeRolRepository(['inventario:leer'])
  );

  const result = await useCase.execute({ accessToken: 'stale_token', permisoRequerido: 'inventario:leer' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'TOKEN_INVALIDO');
});

Deno.test('ValidarPermisoUseCase: aprueba sin verificar permisos si no se requiere permiso específico', async () => {
  const payload = makePayload();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(makeUsuario()),
    makeRolRepository([]) // sin permisos, pero tampoco se requiere uno
  );

  const result = await useCase.execute({ accessToken: 'valid_token' }); // sin permisoRequerido

  assertEquals(result.isSuccess, true);
});

Deno.test('ValidarPermisoUseCase: rechaza con USUARIO_INACTIVO si el usuario está desactivado', async () => {
  const payload = makePayload();
  const usuarioInactivo = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, false, false, null);
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(usuarioInactivo),
    makeRolRepository(['inventario:leer'])
  );

  const result = await useCase.execute({ accessToken: 'valid_token', permisoRequerido: 'inventario:leer' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_INACTIVO');
});
