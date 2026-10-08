/**
 * renovar-token.use-case.test.ts — Pruebas unitarias del RenovarTokenUseCase.
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  RenovarTokenUseCase,
  IUsuarioRepository,
  ITokenService,
  AuthTokens,
  AccessTokenPayload,
  Usuario,
} from '../../mod.ts';

// ─── Factories de mocks ──────────────────────────────────────────────────────

const TOKENS_NUEVOS: AuthTokens = { accessToken: 'nuevo_at', refreshToken: 'nuevo_rt' };

function makeTokenService(opts: { failValidation?: boolean; usuarioId?: string } = {}): ITokenService {
  return {
    generarTokens: (_id: string, _rolId: number) => Promise.resolve(TOKENS_NUEVOS),
    validarAccessToken: (_t: string): Promise<AccessTokenPayload> => Promise.resolve({
      usuarioId: 'uuid-001', rolId: 1, iat: new Date()
    }),
    validarRefreshToken: (_t: string) => {
      if (opts.failValidation) return Promise.reject(new Error('RT inválido'));
      return Promise.resolve({ usuarioId: opts.usuarioId ?? 'uuid-001' });
    },
    revocarRefreshToken: (_t: string) => Promise.resolve(),
  };
}

function makeUsuario(isActive = true): Usuario {
  return new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, isActive, false, null);
}

function makeUsuarioRepository(usuario: Usuario | null): IUsuarioRepository {
  return {
    findByEmail: (_email: string) => Promise.resolve(usuario),
    findById: (_id: string) => Promise.resolve(usuario),
  };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('RenovarTokenUseCase: rota el refresh token y devuelve nuevos tokens', async () => {
  const useCase = new RenovarTokenUseCase(
    makeTokenService(),
    makeUsuarioRepository(makeUsuario())
  );

  const result = await useCase.execute({ refreshToken: 'rt_valido' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.accessToken, 'nuevo_at');
  assertEquals(result.value.refreshToken, 'nuevo_rt');
});

Deno.test('RenovarTokenUseCase: falla con TOKEN_INVALIDO si el refresh token es inválido', async () => {
  const useCase = new RenovarTokenUseCase(
    makeTokenService({ failValidation: true }),
    makeUsuarioRepository(makeUsuario())
  );

  const result = await useCase.execute({ refreshToken: 'rt_expirado' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'TOKEN_INVALIDO');
});

Deno.test('RenovarTokenUseCase: falla con TOKEN_INVALIDO si el usuario no existe', async () => {
  const useCase = new RenovarTokenUseCase(
    makeTokenService(),
    makeUsuarioRepository(null) // usuario eliminado
  );

  const result = await useCase.execute({ refreshToken: 'rt_valido' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'TOKEN_INVALIDO');
});

Deno.test('RenovarTokenUseCase: falla con USUARIO_INACTIVO si el usuario está desactivado', async () => {
  const useCase = new RenovarTokenUseCase(
    makeTokenService(),
    makeUsuarioRepository(makeUsuario(false)) // inactivo
  );

  const result = await useCase.execute({ refreshToken: 'rt_valido' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_INACTIVO');
});
