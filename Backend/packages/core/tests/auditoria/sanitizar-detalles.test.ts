import { assertEquals } from 'jsr:@std/assert@^1';
import { sanitizarDetalles } from '../../src/modules/auditoria/domain/services/sanitizar-detalles.ts';

Deno.test('sanitizarDetalles: devuelve null cuando recibe null o undefined', () => {
  assertEquals(sanitizarDetalles(null), null);
  assertEquals(sanitizarDetalles(undefined), null);
});

Deno.test('sanitizarDetalles: no altera objetos sin claves sensibles', () => {
  const original = { nombre: 'Sucursal Norte', direccion: 'Calle 10 # 5-20' };
  const resultado = sanitizarDetalles(original);

  assertEquals(resultado, original);
  // Verifica inmutabilidad (objeto diferente en memoria)
  assertEquals(resultado !== original, true);
});

Deno.test('sanitizarDetalles: redacta claves sensibles (case-insensitive)', () => {
  const original = {
    usuario: 'admin',
    password: 'Password123!',
    clave_acceso: '9876',
    passwordHash: '$argon2id$...',
    token: 'jwt.token.here',
    refreshToken: 'rt.token.here',
    api_secret: 'supersecret',
    totpKey: 'base32secret',
    otp_code: '123456',
  };

  const resultado = sanitizarDetalles(original);

  assertEquals(resultado, {
    usuario: 'admin',
    password: '[REDACTADO]',
    clave_acceso: '[REDACTADO]',
    passwordHash: '[REDACTADO]',
    token: '[REDACTADO]',
    refreshToken: '[REDACTADO]',
    api_secret: '[REDACTADO]',
    totpKey: '[REDACTADO]',
    otp_code: '[REDACTADO]',
  });
});

Deno.test('sanitizarDetalles: redacta recursivamente en objetos anidados y arrays sin mutar el original', () => {
  const original = {
    nombre: 'Usuario Prueba',
    credenciales: {
      hash: 'argon2_hash',
      historialCambios: [
        { pass: 'vieja1', fecha: '2026-01-01' },
        { pass: 'vieja2', fecha: '2026-02-01' },
      ],
      config: {
        totpSecret: 'totp123',
      },
    },
    roles: ['admin', 'vendedor'],
  };

  const clonOriginal = JSON.parse(JSON.stringify(original));
  const resultado = sanitizarDetalles(original);

  // Asegurar que no se mutó el original
  assertEquals(original, clonOriginal);

  // Verificar valores redactados
  assertEquals(resultado, {
    nombre: 'Usuario Prueba',
    credenciales: {
      hash: '[REDACTADO]',
      historialCambios: [
        { pass: '[REDACTADO]', fecha: '2026-01-01' },
        { pass: '[REDACTADO]', fecha: '2026-02-01' },
      ],
      config: {
        totpSecret: '[REDACTADO]',
      },
    },
    roles: ['admin', 'vendedor'],
  });
});

Deno.test('sanitizarDetalles: previene desbordamiento de pila con límite de profundidad', () => {
  // Objeto con anidamiento profundo
  const profundo = {
    l1: {
      l2: {
        l3: {
          l4: {
            l5: {
              l6: { dato: 'fin' },
            },
          },
        },
      },
    },
  };

  const resultado = sanitizarDetalles(profundo);
  assertEquals(resultado !== null, true);
});
