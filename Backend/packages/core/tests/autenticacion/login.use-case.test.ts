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
): IPasswordService & { getLlamadas: () => number } {
  let llamadas = 0;
  return {
    getLlamadas: () => llamadas,
    comparar: (_plain: string, _hash: string) => {
      llamadas++;
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

interface IntentoRecord {
  email: string;
  ip: string;
  exitoso: boolean;
  fecha: Date;
}

function makeControlIntentos(): {
  registro: IRegistroIntentosLogin;
  control: IControlIntentosLogin;
  intentos: IntentoRecord[];
  agregarIntentoConFecha: (datos: DatosIntentoLogin, fecha: Date) => void;
} {
  const intentos: IntentoRecord[] = [];

  const registro: IRegistroIntentosLogin = {
    registrar: (datos: DatosIntentoLogin) => {
      intentos.push({ ...datos, fecha: new Date() });
      return Promise.resolve();
    },
  };

  const control: IControlIntentosLogin = {
    contarFallidosPorEmail: (email: string, desde: Date) => {
      // 1. Encontrar el último intento exitoso para este email
      const exitos = intentos
        .filter((i) => i.email === email && i.exitoso)
        .sort((a, b) => b.fecha.getTime() - a.fecha.getTime());
      const ultimoExito = exitos[0];
      const fechaCorte = (ultimoExito && ultimoExito.fecha >= desde) ? ultimoExito.fecha : null;

      const fallos = intentos.filter((i) => {
        if (i.email !== email || i.exitoso) return false;
        if (fechaCorte) {
          return i.fecha.getTime() > fechaCorte.getTime();
        }
        return i.fecha.getTime() >= desde.getTime();
      });

      return Promise.resolve(fallos.length);
    },
    contarFallidosPorIp: (ip: string, desde: Date) => {
      const fallos = intentos.filter(
        (i) => i.ip === ip && !i.exitoso && i.fecha.getTime() >= desde.getTime(),
      );
      return Promise.resolve(fallos.length);
    },
  };

  const agregarIntentoConFecha = (datos: DatosIntentoLogin, fecha: Date) => {
    intentos.push({ ...datos, fecha });
  };

  return { registro, control, intentos, agregarIntentoConFecha };
}

// ─── Tests Existentes (actualizados con nuevo puerto) ───────────────────────

Deno.test('LoginUseCase: retorna tokens cuando las credenciales son válidas y registra intento exitoso', async () => {
  const { registro, control, intentos } = makeControlIntentos();
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
  const { registro, control, intentos } = makeControlIntentos();
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
  const { registro, control, intentos } = makeControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(false), // contraseña incorrecta
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
  // Asegura que nunca se guarda la contraseña
  const json = JSON.stringify(intentos[0]);
  assertEquals(json.includes('wrong'), false);
});

Deno.test('LoginUseCase: falla con USUARIO_INACTIVO si el usuario está desactivado y registra intento fallido', async () => {
  const usuarioInactivo = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, false, false, null);
  const { registro, control, intentos } = makeControlIntentos();

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
  const { registro, control, intentos } = makeControlIntentos();

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

// ─── Tests de Bloqueo por Intentos Fallidos (RF-SA-F1, F2, F3) ───────────────

Deno.test('LoginUseCase: 5 fallos seguidos de un email -> el 6.º intento devuelve LOGIN_BLOQUEADO sin llamar a verificación ni insertar', async () => {
  const { registro, control, intentos } = makeControlIntentos();
  const passwordService = makePasswordService(false);
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    passwordService,
    makeTokenService(),
    registro,
    control,
  );

  // 5 intentos fallidos iniciales
  for (let i = 0; i < 5; i++) {
    const res = await useCase.execute({
      email: 'victima@warengine.local',
      passwordPlain: 'wrong',
      ip: `192.168.1.${i + 1}`,
    });
    assertEquals(res.isFailure, true);
    assertEquals(res.error.code, 'CREDENCIALES_INVALIDAS');
  }

  assertEquals(intentos.length, 5);
  assertEquals(passwordService.getLlamadas(), 5);

  // 6.º intento: debe ser bloqueado por cuenta
  const res6 = await useCase.execute({
    email: 'victima@warengine.local',
    passwordPlain: 'clave_incluso_correcta',
    ip: '192.168.1.99',
  });

  assertEquals(res6.isFailure, true);
  assertEquals(res6.error.code, 'LOGIN_BLOQUEADO');
  assertEquals(res6.error.message, 'Demasiados intentos fallidos. Intenta de nuevo en unos minutos.');

  // Los intentos rechazados por estar bloqueado NO se insertan en intentos_login
  assertEquals(intentos.length, 5);
  // Ni se comprueba la contraseña
  assertEquals(passwordService.getLlamadas(), 5);
});

Deno.test('LoginUseCase: un email inexistente también se bloquea tras 5 fallos', async () => {
  const { registro, control, intentos } = makeControlIntentos();
  const passwordService = makePasswordService(false);
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null), // usuario no existe
    passwordService,
    makeTokenService(),
    registro,
    control,
  );

  for (let i = 0; i < 5; i++) {
    const res = await useCase.execute({
      email: 'no_existo@warengine.local',
      passwordPlain: 'password',
      ip: `192.168.1.${i + 1}`,
    });
    assertEquals(res.isFailure, true);
    assertEquals(res.error.code, 'CREDENCIALES_INVALIDAS');
  }

  assertEquals(intentos.length, 5);

  // 6.º intento con email inexistente
  const res6 = await useCase.execute({
    email: 'no_existo@warengine.local',
    passwordPlain: 'password',
    ip: '192.168.1.99',
  });

  assertEquals(res6.isFailure, true);
  assertEquals(res6.error.code, 'LOGIN_BLOQUEADO');
  assertEquals(intentos.length, 5); // No insertado
});

Deno.test('LoginUseCase: un login exitoso reinicia el contador de la cuenta, pero no el de la IP', async () => {
  const { registro, control } = makeControlIntentos();
  let passValid = false;
  const passwordService: IPasswordService = {
    comparar: () => Promise.resolve(passValid),
    hashear: (p) => Promise.resolve(`h_${p}`),
  };

  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    passwordService,
    makeTokenService(),
    registro,
    control,
  );

  const IP_ATACANTE = '192.168.1.100';

  // 4 fallos de cuenta desde la IP
  passValid = false;
  for (let i = 0; i < 4; i++) {
    await useCase.execute({
      email: 'test@warengine.local',
      passwordPlain: 'wrong',
      ip: IP_ATACANTE,
    });
  }

  // 1 login exitoso de la cuenta desde la misma IP -> reinicia el contador de cuenta
  passValid = true;
  const resExito = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'correct',
    ip: IP_ATACANTE,
  });
  assertEquals(resExito.isSuccess, true);

  // Ahora la cuenta tiene 0 fallos posteriores al éxito.
  // Un nuevo fallo debe responder CREDENCIALES_INVALIDAS, no LOGIN_BLOQUEADO
  passValid = false;
  const resFallo1 = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'wrong',
    ip: IP_ATACANTE,
  });
  assertEquals(resFallo1.isFailure, true);
  assertEquals(resFallo1.error.code, 'CREDENCIALES_INVALIDAS');

  // Sin embargo, para la IP, los 4 fallos anteriores NO se reiniciaron con el éxito.
  // La IP ya tiene 4 + 1 = 5 fallos acumulados.
  // Ejecutamos 15 fallos más con otros correos desde esa misma IP (alcanzando 20 fallos de la IP)
  for (let i = 0; i < 15; i++) {
    await useCase.execute({
      email: `otro_usuario_${i}@warengine.local`,
      passwordPlain: 'wrong',
      ip: IP_ATACANTE,
    });
  }

  // El intento número 21 desde esa IP debe ser bloqueado por IP
  const resBloqueoIp = await useCase.execute({
    email: 'tercer_usuario@warengine.local',
    passwordPlain: 'wrong',
    ip: IP_ATACANTE,
  });
  assertEquals(resBloqueoIp.isFailure, true);
  assertEquals(resBloqueoIp.error.code, 'LOGIN_BLOQUEADO');
});

Deno.test('LoginUseCase: fallos fuera de la ventana no cuentan', async () => {
  const { registro, control, agregarIntentoConFecha } = makeControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(makeUsuario()),
    makePasswordService(true),
    makeTokenService(),
    registro,
    control,
  );

  // Agregamos 5 intentos fallidos ocurridos hace 10 minutos (fuera de la ventana de 5 minutos)
  const haceDiezMin = new Date(Date.now() - 10 * 60 * 1000);
  for (let i = 0; i < 5; i++) {
    agregarIntentoConFecha(
      { email: 'test@warengine.local', ip: '10.0.0.1', exitoso: false },
      haceDiezMin,
    );
  }

  // Un intento actual con credenciales válidas debe pasar
  const result = await useCase.execute({
    email: 'test@warengine.local',
    passwordPlain: 'pass123',
    ip: '10.0.0.1',
  });

  assertEquals(result.isSuccess, true);
});

Deno.test('LoginUseCase: límite por IP: 20 fallos desde la misma IP con correos distintos bloquean esa IP', async () => {
  const { registro, control, intentos } = makeControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null),
    makePasswordService(false),
    makeTokenService(),
    registro,
    control,
  );

  const IP = '192.168.1.200';

  for (let i = 0; i < 20; i++) {
    const res = await useCase.execute({
      email: `victima_${i}@warengine.local`,
      passwordPlain: 'wrong',
      ip: IP,
    });
    assertEquals(res.isFailure, true);
    assertEquals(res.error.code, 'CREDENCIALES_INVALIDAS');
  }

  assertEquals(intentos.length, 20);

  // Intento 21 con un correo totalmente nuevo desde la misma IP
  const res21 = await useCase.execute({
    email: 'nuevo_usuario@warengine.local',
    passwordPlain: 'cualquiera',
    ip: IP,
  });

  assertEquals(res21.isFailure, true);
  assertEquals(res21.error.code, 'LOGIN_BLOQUEADO');
  assertEquals(intentos.length, 20); // No se inserta
});

Deno.test('LoginUseCase: IP null no activa el límite por IP', async () => {
  const { registro, control } = makeControlIntentos();
  const useCase = new LoginUseCase(
    makeUsuarioRepository(null),
    makePasswordService(false),
    makeTokenService(),
    registro,
    control,
  );

  // 20 fallos con IP null y correos distintos
  for (let i = 0; i < 20; i++) {
    await useCase.execute({
      email: `sin_ip_${i}@warengine.local`,
      passwordPlain: 'wrong',
      ip: null,
    });
  }

  // Intento 21 con IP null: NO debe ser bloqueado por IP
  const res21 = await useCase.execute({
    email: 'sin_ip_21@warengine.local',
    passwordPlain: 'wrong',
    ip: null,
  });

  assertEquals(res21.isFailure, true);
  assertEquals(res21.error.code, 'CREDENCIALES_INVALIDAS'); // Falla por credenciales, NO bloqueado
});
