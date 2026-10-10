/**
 * logout.use-case.test.ts — Pruebas unitarias del LogoutUseCase (RF-SA-G1).
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  LogoutUseCase,
  ITokenService,
  AuthTokens,
  AccessTokenPayload,
} from '../../mod.ts';

function makeTokenService(opts: {
  onRevocar?: (token: string) => void;
  shouldFailRevocacion?: boolean;
} = {}): ITokenService {
  return {
    generarTokens: () =>
      Promise.resolve({ accessToken: 'at', refreshToken: 'rt' } as AuthTokens),
    validarAccessToken: () =>
      Promise.resolve({ usuarioId: 'uuid-1', rolId: 1, iat: new Date() } as AccessTokenPayload),
    validarRefreshToken: () => Promise.resolve({ usuarioId: 'uuid-1' }),
    revocarRefreshToken: (token: string) => {
      opts.onRevocar?.(token);
      if (opts.shouldFailRevocacion) {
        return Promise.reject(new Error('Token no encontrado en BD o ya revocado'));
      }
      return Promise.resolve();
    },
  };
}

Deno.test('LogoutUseCase: revoca el refresh token cuando se provee', async () => {
  let tokenRevocado: string | null = null;
  const tokenService = makeTokenService({
    onRevocar: (t) => {
      tokenRevocado = t;
    },
  });

  const useCase = new LogoutUseCase(tokenService);

  const result = await useCase.execute({ refreshToken: 'uuid-refresh-token-valido' });

  assertEquals(result.isSuccess, true);
  assertEquals(tokenRevocado, 'uuid-refresh-token-valido');
});

Deno.test('LogoutUseCase: con token ausente o vacío devuelve éxito sin invocar revocación', async () => {
  let llamadasRevocar = 0;
  const tokenService = makeTokenService({
    onRevocar: () => {
      llamadasRevocar++;
    },
  });

  const useCase = new LogoutUseCase(tokenService);

  const resultNull = await useCase.execute({ refreshToken: null });
  assertEquals(resultNull.isSuccess, true);

  const resultUndefined = await useCase.execute({});
  assertEquals(resultUndefined.isSuccess, true);

  const resultVacio = await useCase.execute({ refreshToken: '   ' });
  assertEquals(resultVacio.isSuccess, true);

  assertEquals(llamadasRevocar, 0);
});

Deno.test('LogoutUseCase: con token desconocido o ya revocado devuelve éxito (idempotente)', async () => {
  const tokenService = makeTokenService({
    shouldFailRevocacion: true,
  });

  const useCase = new LogoutUseCase(tokenService);

  const result = await useCase.execute({ refreshToken: 'token-inexistente-o-ya-revocado' });

  assertEquals(result.isSuccess, true);
});
