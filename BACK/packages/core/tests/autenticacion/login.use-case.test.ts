/**
 * login.use-case.test.ts — Pruebas unitarias del LoginUseCase.
 *
 * Estrategia: mocks manuales de todas las dependencias (ports).
 * No se toca la BD ni se genera JWT real: solo se verifica la lógica de orquestación,
 * rate limiting y bloqueo por cuenta e IP (RF-SA-F1, RF-SA-F2, RF-SA-F3, RF-SA-F4, RF-SA-F5).
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
  IControlIntentosLogin,
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

function makePasswordService(
  isValid: boolean,
  onComparar?: () => void,
): IPasswordService {
  return {
    comparar: (_plain: string, _hash: string) => {
      onComparar?.();
      return Promise.resolve(isValid);
    },
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

interface IntentoConFecha extends DatosIntentoLogin {
  fecha: Date;
}

function makeRegistroYControlIntentos(): {
  registro: IRegistroIntentosLogin;
  control: IControlIntentosLogin;
  intentos: IntentoConFecha[];
} {
  const intentos: IntentoConFecha[] = [];
  let seq = 0;

  const registro: IRegistroIntentosLogin = {
    registrar: (datos: DatosIntentoLogin) => {
      intentos.push({ ...datos, fecha: new Date(Date.now() + seq++) });
      return Promise.resolve();
    },
  };

  const control: IControlIntentosLogin = {
    contarFallosRecientesPorEmail: (email: string, desde: Date) => {
      let fechaUltimoExito: Date | null = null;
      for (let i = intentos.length - 1; i >= 0; i--) {
        if (intentos[i].email === email && intentos[i].exitoso) {
          fechaUltimoExito = intentos[i].fecha;
          break;
        }
      }

      const fechaCorte = fechaUltimoExito && fechaUltimoExito > desde
        ? fechaUltimoExito
        : desde;
      const esEstricto = Boolean(fechaUltimoExito && fechaUltimoExito > desde);

      const count = intentos.filter((item) => {
        if (item.email !== email || item.exitoso) return false;
        return esEstricto ? item.fecha > fechaCorte : item.fecha >= fechaCorte;
      }).length;

      return Promise.resolve(count);
    },

    contarFallosRecientesPorIp: (ip: string, desde: Date) => {
      const count = intentos.filter((item) => {
        if (item.ip !== ip || item.exitoso) return false;
        return item.fecha >= desde;
      }).length;

      return Promise.resolve(count);
    },
  };

  return { registro, control, intentos };
}

// ─── Tests existentes ────────────────────────────────────────────────────────

Deno.test('LoginUseCase: retorna tokens cuando las credenciales son válidas y registra intento exitoso', async () => {
  const { registro, control, intentos } = makeRegistroYControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(true),
    makeTokenService(),
    registro,
    control,
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
  assertEquals(intentos[0].email, 'test@warengine.local');
  assertEquals(intentos[0].ip, '10.0.0.1');
  assertEquals(intentos[0].exitoso, true);
});

Deno.test('LoginUseCase: falla con CREDENCIALES_INVALIDAS si el email no existe y registra intento fallido', async () => {
  const { registro, control, intentos } = makeRegistroYControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null),
    makePasswordService(true),
    makeTokenService(),
    registro,
    control,
  );

  const result = await useCase.execute({
    email: 'noexiste@x.com',
    passwordPlain: 'pass123',
    ip: '10.0.0.2',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'CREDENCIALES_INVALIDAS');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0].email, 'noexiste@x.com');
  assertEquals(intentos[0].ip, '10.0.0.2');
  assertEquals(intentos[0].exitoso, false);
});

Deno.test('LoginUseCase: falla con CREDENCIALES_INVALIDAS si la contraseña es incorrecta y registra intento fallido', async () => {
  const { registro, control, intentos } = makeRegistroYControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(false),
    makeTokenService(),
    registro,
    control,
  );

  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'wrong',
    ip: '10.0.0.3',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'CREDENCIALES_INVALIDAS');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0].email, 'test@warengine.local');
  assertEquals(intentos[0].ip, '10.0.0.3');
  assertEquals(intentos[0].exitoso, false);
  const json = JSON.stringify(intentos[0]);
  assertEquals(json.includes('wrong'), false);
});

Deno.test('LoginUseCase: falla con USUARIO_INACTIVO si el usuario está desactivado y registra intento fallido', async () => {
  const usuarioInactivo = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, false, false, null);
  const { registro, control, intentos } = makeRegistroYControlIntentos();

  const useCase = new LoginUseCase(
    makeUsuarioRepository(usuarioInactivo),
    makePasswordService(true),
    makeTokenService(),
    registro,
    control,
  );

  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.4',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_INACTIVO');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0].email, 'test@warengine.local');
  assertEquals(intentos[0].ip, '10.0.0.4');
  assertEquals(intentos[0].exitoso, false);
});

Deno.test('LoginUseCase: falla con REQUIERE_2FA si el usuario tiene 2FA activado y registra intento fallido', async () => {
  const usuario2fa = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, true, true, null);
  const { registro, control, intentos } = makeRegistroYControlIntentos();

  const useCase = new LoginUseCase(
    makeUsuarioRepository(usuario2fa),
    makePasswordService(true),
    makeTokenService(),
    registro,
    control,
  );

  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.5',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'REQUIERE_2FA');

  assertEquals(intentos.length, 1);
  assertEquals(intentos[0].email, 'test@warengine.local');
  assertEquals(intentos[0].ip, '10.0.0.5');
  assertEquals(intentos[0].exitoso, false);
});

// ─── Tests de Rate Limiting y Bloqueo (RF-SA-F1 a F3) ────────────────────────

Deno.test('5 fallos seguidos de un email -> el 6.º intento devuelve LOGIN_BLOQUEADO sin llamar a la verificación de contraseña ni insertar intento', async () => {
  const { registro, control, intentos } = makeRegistroYControlIntentos();
  let compararLlamado = false;
  const passwordService = makePasswordService(false, () => {
    compararLlamado = true;
  });

  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    passwordService,
    makeTokenService(),
    registro,
    control,
  );

  // 5 intentos fallidos
  for (let i = 0; i < 5; i++) {
    const res = await useCase.execute({
      email: 'test@warengine.local',
      passwordPlain: `wrong_${i}`,
      ip: '10.0.0.1',
    });
    assertEquals(res.isFailure, true);
    assertEquals(res.error.code, 'CREDENCIALES_INVALIDAS');
  }

  assertEquals(intentos.length, 5);

  // 6.º intento: debe bloquearse
  compararLlamado = false;
  const sextoIntento = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.1',
  });

  assertEquals(sextoIntento.isFailure, true);
  assertEquals(sextoIntento.error.code, 'LOGIN_BLOQUEADO');
  assertEquals(
    sextoIntento.error.message,
    'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.',
  );
  assertEquals(compararLlamado, false); // NO debe llamar a verificar contraseña
  assertEquals(intentos.length, 5); // NO debe registrar un intento nuevo
});

Deno.test('Un email inexistente también se bloquea tras 5 fallos', async () => {
  const { registro, control, intentos } = makeRegistroYControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null), // usuario inexistente
    makePasswordService(true),
    makeTokenService(),
    registro,
    control,
  );

  // 5 intentos con email inexistente
  for (let i = 0; i < 5; i++) {
    const res = await useCase.execute({
      email: 'fantasma@noexiste.local',
      passwordPlain: 'random',
      ip: '10.0.0.1',
    });
    assertEquals(res.isFailure, true);
    assertEquals(res.error.code, 'CREDENCIALES_INVALIDAS');
  }

  assertEquals(intentos.length, 5);

  // 6.º intento
  const sextoIntento = await useCase.execute({
    email: 'fantasma@noexiste.local',
    passwordPlain: 'random',
    ip: '10.0.0.1',
  });

  assertEquals(sextoIntento.isFailure, true);
  assertEquals(sextoIntento.error.code, 'LOGIN_BLOQUEADO');
  assertEquals(intentos.length, 5); // Sin inserción adicional
});

Deno.test('Un login exitoso reinicia el contador de la cuenta, pero no el de la IP', async () => {
  const { registro, control } = makeRegistroYControlIntentos();
  let credencialValida = false;

  const passwordService: IPasswordService = {
    comparar: () => Promise.resolve(credencialValida),
    hashear: (plain: string) => Promise.resolve(plain),
  };

  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    passwordService,
    makeTokenService(),
    registro,
    control,
  );

  // 4 fallos seguidos desde IP 10.0.0.99
  for (let i = 0; i < 4; i++) {
    await useCase.execute({
      email: 'test@warengine.local',
      passwordPlain: 'wrong',
      ip: '10.0.0.99',
    });
  }

  // 1 login exitoso
  credencialValida = true;
  const loginExitoso = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.99',
  });
  assertEquals(loginExitoso.isSuccess, true);

  // Ahora 4 fallos más
  credencialValida = false;
  for (let i = 0; i < 4; i++) {
    await useCase.execute({
      email: 'test@warengine.local',
      passwordPlain: 'wrong',
      ip: '10.0.0.99',
    });
  }

  // Para la cuenta: solo hay 4 fallos posteriores al último éxito → NO está bloqueada por cuenta
  const fallosCuenta = await control.contarFallosRecientesPorEmail(
    'test@warengine.local',
    new Date(Date.now() - 5 * 60 * 1000),
  );
  assertEquals(fallosCuenta, 4);

  // Para la IP: el éxito NO reinicia el contador → 4 + 4 = 8 fallos
  const fallosIp = await control.contarFallosRecientesPorIp(
    '10.0.0.99',
    new Date(Date.now() - 15 * 60 * 1000),
  );
  assertEquals(fallosIp, 8);
});

Deno.test('Fallos fuera de la ventana no cuentan', async () => {
  const { registro, control, intentos } = makeRegistroYControlIntentos();

  // Simular 5 fallos ocurridos hace 10 minutos (fuera de la ventana de 5 min)
  const haceDiezMin = new Date(Date.now() - 10 * 60 * 1000);
  for (let i = 0; i < 5; i++) {
    intentos.push({
      email: 'test@warengine.local',
      ip: '10.0.0.1',
      exitoso: false,
      fecha: haceDiezMin,
    });
  }

  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(true),
    makeTokenService(),
    registro,
    control,
  );

  // El intento actual debe permitir autenticar porque los fallos anteriores están fuera de la ventana
  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.1',
  });

  assertEquals(result.isSuccess, true);
});

Deno.test('Límite por IP: 20 fallos desde la misma IP con correos distintos bloquean esa IP', async () => {
  const { registro, control, intentos } = makeRegistroYControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null),
    makePasswordService(false),
    makeTokenService(),
    registro,
    control,
  );

  const ipAtaque = '198.51.100.25';

  // 20 fallos con 20 correos distintos (ningún correo individual supera los 5 fallos)
  for (let i = 0; i < 20; i++) {
    const res = await useCase.execute({
      email: `victima_${i}@warengine.local`,
      passwordPlain: 'pass',
      ip: ipAtaque,
    });
    assertEquals(res.isFailure, true);
    assertEquals(res.error.code, 'CREDENCIALES_INVALIDAS');
  }

  assertEquals(intentos.length, 20);

  // 21.º intento desde esa misma IP (incluso con otro correo nuevo)
  const intento21 = await useCase.execute({
    email: 'nueva_victima@warengine.local',
    passwordPlain: 'pass',
    ip: ipAtaque,
  });

  assertEquals(intento21.isFailure, true);
  assertEquals(intento21.error.code, 'LOGIN_BLOQUEADO');
  assertEquals(intentos.length, 20); // No insertado
});

Deno.test('IP null no activa el límite por IP', async () => {
  const { registro, control, intentos } = makeRegistroYControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null),
    makePasswordService(false),
    makeTokenService(),
    registro,
    control,
  );

  // 25 fallos con IP null y correos distintos
  for (let i = 0; i < 25; i++) {
    await useCase.execute({
      email: `correo_distinto_${i}@warengine.local`,
      passwordPlain: 'pass',
      ip: null,
    });
  }

  assertEquals(intentos.length, 25);

  // Siguiente intento con IP null y otro correo no debe bloquearse por IP
  const siguiente = await useCase.execute({
    email: 'nuevo_correo@warengine.local',
    passwordPlain: 'pass',
    ip: null,
  });

  // Falla por credenciales inválidas (usuario no existe), pero NO por LOGIN_BLOQUEADO
  assertEquals(siguiente.isFailure, true);
  assertEquals(siguiente.error.code, 'CREDENCIALES_INVALIDAS');
});
