/**
 * logout.use-case.test.ts — Pruebas unitarias de LogoutUseCase (RF-SA-G1).
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import { LogoutUseCase, ITokenService, AuthTokens, AccessTokenPayload } from '../../mod.ts';

function makeTokenService(onRevoke?: (token: string) => Promise<void>): ITokenService {
  return {
    generarTokens: (_id: string, _rolId: number): Promise<AuthTokens> =>
      Promise.resolve({ accessToken: 'at', refreshToken: 'rt' }),
    validarAccessToken: (_t: string): Promise<AccessTokenPayload> =>
      Promise.resolve({ usuarioId: 'u1', rolId: 1, iat: new Date() }),
    validarRefreshToken: (_t: string) => Promise.resolve({ usuarioId: 'u1' }),
    revocarRefreshToken: onRevoke ?? ((_t: string) => Promise.resolve()),
  };
}

Deno.test('LogoutUseCase: revoca el refresh token cuando está presente', async () => {
  let tokenRevocado: string | null = null;
  const tokenService = makeTokenService((token) => {
    tokenRevocado = token;
    return Promise.resolve();
  });

  const useCase = new LogoutUseCase(tokenService);
  const result = await useCase.execute({ refreshToken: 'uuid-refresh-token-123' });

  assertEquals(result.isSuccess, true);
  assertEquals(tokenRevocado, 'uuid-refresh-token-123');
});

Deno.test('LogoutUseCase: con token ausente (undefined o null) devuelve éxito sin llamar a revocación', async () => {
  let llamadas = 0;
  const tokenService = makeTokenService(() => {
    llamadas++;
    return Promise.resolve();
  });

  const useCase = new LogoutUseCase(tokenService);

  const res1 = await useCase.execute({});
  assertEquals(res1.isSuccess, true);
  assertEquals(llamadas, 0);

  const res2 = await useCase.execute({ refreshToken: null });
  assertEquals(res2.isSuccess, true);
  assertEquals(llamadas, 0);
});

Deno.test('LogoutUseCase: con token desconocido o ya revocado devuelve éxito (idempotente)', async () => {
  const tokenService = makeTokenService(() => {
    return Promise.reject(new Error('Token desconocido o ya revocado'));
  });

  const useCase = new LogoutUseCase(tokenService);
  const result = await useCase.execute({ refreshToken: 'token-inexistente' });

  assertEquals(result.isSuccess, true);
});
