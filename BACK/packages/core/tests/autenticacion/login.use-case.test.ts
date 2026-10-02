/**
 * login.use-case.test.ts — Pruebas unitarias del LoginUseCase.
 *
 * Estrategia: mocks manuales de todas las dependencias (ports).
 * No se toca la BD ni se genera JWT real: solo se verifica la lógica de orquestación.
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  LoginUseCase,
  IUsuarioRepository,
  IPasswordService,
  ITokenService,
  AuthTokens,
  AccessTokenPayload,
  Usuario,
} from '../../mod.ts';

// ─── Factories de mocks ──────────────────────────────────────────────────────

function makeUsuario(overrides: Partial<ConstructorParameters<typeof Usuario>> = []): Usuario {
  return new Usuario(
    overrides[0] ?? 'uuid-001',
    overrides[1] ?? 'test@warengine.local',
    overrides[2] ?? 'hash_seguro',
    overrides[3] ?? 1,
    overrides[4] ?? true,  // isActive
    overrides[5] ?? false, // requiere2fa
    overrides[6] ?? null   // tokensInvalidadosEn
  );
}

function makeUsuarioRepository(usuario: Usuario | null): IUsuarioRepository {
  return {
    findByEmail: (_email: string) => Promise.resolve(usuario),
    findById: (_id: string) => Promise.resolve(usuario),
  };
}

function makePasswordService(isValid: boolean): IPasswordService {
  return {
    comparar: (_plain: string, _hash: string) => Promise.resolve(isValid),
    hashear: (plain: string) => Promise.resolve(`hashed_${plain}`),
  };
}

const TOKENS_MOCK: AuthTokens = { accessToken: 'at_test', refreshToken: 'rt_test' };

function makeTokenService(): ITokenService {
  return {
    generarTokens: (_id: string, _rolId: number) => Promise.resolve(TOKENS_MOCK),
    validarAccessToken: (_t: string): Promise<AccessTokenPayload> => Promise.resolve({
      usuarioId: 'uuid-001', rolId: 1, iat: new Date()
    }),
    validarRefreshToken: (_t: string) => Promise.resolve({ usuarioId: 'uuid-001' }),
    revocarRefreshToken: (_t: string) => Promise.resolve(),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('LoginUseCase: retorna tokens cuando las credenciales son válidas', async () => {
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(true),
    makeTokenService()
  );

  const result = await useCase.execute({ email: 'test@warengine.local', passwordPlain: 'pass123' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.accessToken, 'at_test');
  assertEquals(result.value.refreshToken, 'rt_test');
});

Deno.test('LoginUseCase: falla con CREDENCIALES_INVALIDAS si el email no existe', async () => {
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null),
    makePasswordService(true),
    makeTokenService()
  );

  const result = await useCase.execute({ email: 'noexiste@x.com', passwordPlain: 'pass123' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'CREDENCIALES_INVALIDAS');
});

Deno.test('LoginUseCase: falla con CREDENCIALES_INVALIDAS si la contraseña es incorrecta', async () => {
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(false), // contraseña incorrecta
    makeTokenService()
  );

  const result = await useCase.execute({ email: 'test@warengine.local', passwordPlain: 'wrong' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'CREDENCIALES_INVALIDAS');
});

Deno.test('LoginUseCase: falla con USUARIO_INACTIVO si el usuario está desactivado', async () => {
  const usuarioInactivo = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, false, false, null);

  const useCase = new LoginUseCase(
    makeUsuarioRepository(usuarioInactivo),
    makePasswordService(true),
    makeTokenService()
  );

  const result = await useCase.execute({ email: 'test@warengine.local', passwordPlain: 'pass123' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_INACTIVO');
});

Deno.test('LoginUseCase: falla con REQUIERE_2FA si el usuario tiene 2FA activado', async () => {
  const usuario2fa = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, true, true, null);

  const useCase = new LoginUseCase(
    makeUsuarioRepository(usuario2fa),
    makePasswordService(true),
    makeTokenService()
  );

  const result = await useCase.execute({ email: 'test@warengine.local', passwordPlain: 'pass123' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'REQUIERE_2FA');
});
