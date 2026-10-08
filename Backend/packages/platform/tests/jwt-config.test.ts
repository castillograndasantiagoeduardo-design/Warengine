import { assertEquals, assertThrows } from 'jsr:@std/assert@^1';
import { obtenerJwtSecret } from '../src/config/jwt.config.ts';
import { JwtTokenService } from '../src/jwt/jwt-token-service.ts';
import { IRefreshTokenRepository } from '@warengine/core';

const fakeRefreshTokenRepo: IRefreshTokenRepository = {
  guardar: () => Promise.resolve(),
  validar: () => Promise.resolve(null),
  revocar: () => Promise.resolve(),
};

Deno.test('jwt.config: lanza error claro si JWT_SECRET no existe', () => {
  assertThrows(
    () => {
      obtenerJwtSecret({ JWT_SECRET: '' });
    },
    Error,
    'La variable de entorno JWT_SECRET es requerida',
  );
});

Deno.test('jwt.config: lanza error claro si JWT_SECRET tiene menos de 32 caracteres', () => {
  assertThrows(
    () => {
      obtenerJwtSecret({ JWT_SECRET: 'clave_corta_123' });
    },
    Error,
    'al menos 32 caracteres',
  );
});

Deno.test('jwt.config: retorna el secreto si tiene 32 o más caracteres', () => {
  const secretValido = 'una_clave_muy_segura_de_mas_de_32_caracteres_12345';
  const resultado = obtenerJwtSecret({ JWT_SECRET: secretValido });
  assertEquals(resultado, secretValido);
});

Deno.test('JwtTokenService: rechaza arrancar con clave menor a 32 caracteres', () => {
  assertThrows(
    () => {
      new JwtTokenService(fakeRefreshTokenRepo, 'clave_demasiado_corta');
    },
    Error,
    'al menos 32 caracteres',
  );
});
