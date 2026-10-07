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
  IRegistroIntentosLogin,
  DatosIntentoLogin,
} from '../../mod.ts';

// ─── Factories de mocks ──────────────────────────────────────────────────────

function makeUsuario(overrides: Partial<ConstructorParameters<typeof Usuario>> = []): Usuario {
  return new Usuario(
    overrides[0] ?? 'uuid-001',
    overrides[1] ?? 'test@warengine.local',
    overrides[2] ?? 'hash_seguro',
    overrides[3] ?? 1,
    overrides[4] ?? true, // isActive
    overrides[5] ?? false, // requiere2fa
    overrides[6] ?? null, // tokensInvalidadosEn
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
    validarAccessToken: (_t: string): Promise<AccessTokenPayload> =>
      Promise.resolve({
        usuarioId: 'uuid-001',
        rolId: 1,
        iat: new Date(),
      }),
    validarRefreshToken: (_t: string) => Promise.resolve({ usuarioId: 'uuid-001' }),
    revocarRefreshToken: (_t: string) => Promise.resolve(),
  };
}

function makeRegistroIntentos(): {
  registro: IRegistroIntentosLogin;
  intentos: DatosIntentoLogin[];
} {
  const intentos: DatosIntentoLogin[] = [];
  const registro: IRegistroIntentosLogin = {
    registrar: (datos: DatosIntentoLogin) => {
      intentos.push(datos);
      return Promise.resolve();
    },
  };
  return { registro, intentos };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('LoginUseCase: retorna tokens cuando las credenciales son válidas y registra intento exitoso', async () => {
  const { registro, intentos } = makeRegistroIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(true),
    makeTokenService(),
    registro,
  );

  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.1',
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.accessToken, 'at_test');
  assertEquals(result.value.refreshToken, 'rt_test');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0], {
    email: 'test@warengine.local',
    ip: '10.0.0.1',
    exitoso: true,
  });
});

Deno.test('LoginUseCase: falla con CREDENCIALES_INVALIDAS si el email no existe y registra intento fallido', async () => {
  const { registro, intentos } = makeRegistroIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null),
    makePasswordService(true),
    makeTokenService(),
    registro,
  );

  const result = await useCase.execute({
    email: 'noexiste@x.com',
    passwordPlain: 'pass123',
    ip: '10.0.0.2',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'CREDENCIALES_INVALIDAS');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0], {
    email: 'noexiste@x.com',
    ip: '10.0.0.2',
    exitoso: false,
  });
});

Deno.test('LoginUseCase: falla con CREDENCIALES_INVALIDAS si la contraseña es incorrecta y registra intento fallido', async () => {
  const { registro, intentos } = makeRegistroIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(false), // contraseña incorrecta
    makeTokenService(),
    registro,
  );

  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'wrong',
    ip: '10.0.0.3',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'CREDENCIALES_INVALIDAS');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0], {
    email: 'test@warengine.local',
    ip: '10.0.0.3',
    exitoso: false,
  });
  // Asegura que nunca se guarda la contraseña
  const json = JSON.stringify(intentos[0]);
  assertEquals(json.includes('wrong'), false);
});

Deno.test('LoginUseCase: falla con USUARIO_INACTIVO si el usuario está desactivado y registra intento fallido', async () => {
  const usuarioInactivo = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, false, false, null);
  const { registro, intentos } = makeRegistroIntentos();

  const useCase = new LoginUseCase(
    makeUsuarioRepository(usuarioInactivo),
    makePasswordService(true),
    makeTokenService(),
    registro,
  );

  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.4',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_INACTIVO');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0], {
    email: 'test@warengine.local',
    ip: '10.0.0.4',
    exitoso: false,
  });
});

Deno.test('LoginUseCase: falla con REQUIERE_2FA si el usuario tiene 2FA activado y registra intento fallido', async () => {
  const usuario2fa = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, true, true, null);
  const { registro, intentos } = makeRegistroIntentos();

  const useCase = new LoginUseCase(
    makeUsuarioRepository(usuario2fa),
    makePasswordService(true),
    makeTokenService(),
    registro,
  );

  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.5',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'REQUIERE_2FA');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0], {
    email: 'test@warengine.local',
    ip: '10.0.0.5',
    exitoso: false,
  });
});
