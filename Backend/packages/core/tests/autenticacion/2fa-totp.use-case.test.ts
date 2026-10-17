import { assertEquals, assert } from 'jsr:@std/assert@1';
import {
  Usuario,
  IUsuarioRepository,
  ITotpService,
  ITokenService,
  IRegistroIntentosLogin,
  IRolRepository,
  IPasswordService,
  Configurar2FAUseCase,
  Activar2FAUseCase,
  Verificar2FALoginUseCase,
  Desactivar2FAUseCase,
  LoginUseCase,
  Requiere2FAError,
} from '@warengine/core';
import { IAuditor, EventoAuditoria } from '../../src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';
import { TotpService } from '../../../platform/src/totp/totp-service.ts';

function createMockUsuario(overrides: Partial<Usuario> = {}): Usuario {
  return new Usuario(
    overrides.id ?? 'user-uuid-1',
    overrides.email ?? 'admin@warengine.com',
    overrides.passwordHash ?? 'hashed_pw',
    overrides.rolId ?? 1,
    overrides.isActive ?? true,
    overrides.requiere2fa ?? false,
    overrides.tokensInvalidadosEn ?? null,
    overrides.totpSecret ?? null,
  );
}

class FakeUsuarioRepository implements IUsuarioRepository {
  public usuarios: Map<string, Usuario> = new Map();

  findByEmail(email: string): Promise<Usuario | null> {
    for (const u of this.usuarios.values()) {
      if (u.email === email) return Promise.resolve(u);
    }
    return Promise.resolve(null);
  }

  findById(id: string): Promise<Usuario | null> {
    return Promise.resolve(this.usuarios.get(id) ?? null);
  }

  actualizarTotp(usuarioId: string, totpSecret: string | null, requiere2fa: boolean): Promise<void> {
    const u = this.usuarios.get(usuarioId);
    if (u) {
      this.usuarios.set(
        usuarioId,
        new Usuario(
          u.id,
          u.email,
          u.passwordHash,
          u.rolId,
          u.isActive,
          requiere2fa,
          u.tokensInvalidadosEn,
          totpSecret,
        ),
      );
    }
    return Promise.resolve();
  }
}

class FakeAuditor implements IAuditor {
  public eventos: EventoAuditoria[] = [];
  registrar(evento: EventoAuditoria): Promise<void> {
    this.eventos.push(evento);
    return Promise.resolve();
  }
}

class FakeTokenService implements ITokenService {
  generarTokens(usuarioId: string, rolId: number) {
    return Promise.resolve({ accessToken: `at_${usuarioId}_${rolId}`, refreshToken: `rt_${usuarioId}` });
  }
  validarAccessToken(_token: string) {
    return Promise.resolve({ usuarioId: 'user-uuid-1', rolId: 1, iat: new Date() });
  }
  validarRefreshToken(_token: string) {
    return Promise.resolve({ usuarioId: 'user-uuid-1' });
  }
  revocarRefreshToken(_token: string) {
    return Promise.resolve();
  }
  generarToken2faTemporal(usuarioId: string) {
    return Promise.resolve(`temp_2fa_${usuarioId}`);
  }
  validarToken2faTemporal(token: string) {
    if (token.startsWith('temp_2fa_')) {
      return Promise.resolve({ usuarioId: token.replace('temp_2fa_', '') });
    }
    return Promise.reject(new Error('Token inválido'));
  }
}

class FakeRolRepository implements IRolRepository {
  obtenerPermisosDeRol(rolId: number): Promise<string[]> {
    return Promise.resolve(rolId === 1 ? ['facturacion:facturar', 'inventario:leer'] : []);
  }
  obtenerNombreDeRol(rolId: number): Promise<string | null> {
    return Promise.resolve(rolId === 1 ? 'super-admin' : 'cajero');
  }
}


Deno.test('RF-SA-D12: TotpService genera secreto Base32 y valida códigos', async () => {
  const totp = new TotpService();
  const { secretBase32, otpauthUrl } = totp.generarSecreto('superadmin@warengine.local');

  assert(secretBase32.length >= 16, 'El secreto Base32 debe tener al menos 16 caracteres');
  assert(otpauthUrl.includes('otpauth://totp/'), 'La URL debe cumplir formato otpauth://');
  assert(otpauthUrl.includes('secret='), 'La URL debe incluir el parámetro secret');

  // Código erróneo
  const esInvalido = await totp.validarCodigo(secretBase32, '000000');
  assertEquals(esInvalido, false);
});

Deno.test('RF-SA-D12: Configurar2FAUseCase genera configuración para usuario activo', async () => {
  const userRepo = new FakeUsuarioRepository();
  const usuario = createMockUsuario({ id: 'u-1', email: 'santiago@warengine.local' });
  userRepo.usuarios.set('u-1', usuario);

  const totpService = new TotpService();
  const useCase = new Configurar2FAUseCase(userRepo, totpService);

  const res = await useCase.execute({ usuarioId: 'u-1' });
  assert(res.isSuccess);
  assert(res.value.secretBase32.length >= 16);
  assert(res.value.otpauthUrl.includes('santiago%40warengine.local'));
});

Deno.test('RF-SA-D12: Activar2FAUseCase rechaza código incorrecto y no activa 2FA', async () => {
  const userRepo = new FakeUsuarioRepository();
  const usuario = createMockUsuario({ id: 'u-2', email: 'diego@warengine.local', requiere2fa: false });
  userRepo.usuarios.set('u-2', usuario);

  const totpService = new TotpService();
  const auditor = new FakeAuditor();
  const useCase = new Activar2FAUseCase(userRepo, totpService, auditor);

  const res = await useCase.execute({
    usuarioId: 'u-2',
    secretBase32: 'JBSWY3DPEHPK3PXP',
    codigoTotp: '123456',
  });

  assert(res.isFailure);
  assertEquals(res.error.code, 'CODIGO_TOTP_INVALIDO');

  const uDb = await userRepo.findById('u-2');
  assertEquals(uDb?.requiere2fa, false);
  assertEquals(auditor.eventos.length, 0);
});

Deno.test('RF-SA-D12: Activar2FAUseCase activa 2FA y audita sin filtrar secretos', async () => {
  const userRepo = new FakeUsuarioRepository();
  const usuario = createMockUsuario({ id: 'u-3', email: 'oscar@warengine.local', requiere2fa: false });
  userRepo.usuarios.set('u-3', usuario);

  const mockTotp: ITotpService = {
    generarSecreto: () => ({ secretBase32: 'TESTSECRET', otpauthUrl: '' }),
    validarCodigo: (_s, code) => Promise.resolve(code === '654321'),
  };

  const auditor = new FakeAuditor();
  const useCase = new Activar2FAUseCase(userRepo, mockTotp, auditor);

  const res = await useCase.execute({
    usuarioId: 'u-3',
    secretBase32: 'TESTSECRET',
    codigoTotp: '654321',
    actor: { usuarioId: 'u-3', ip: '127.0.0.1' },
  });


  assert(res.isSuccess);
  const uDb = await userRepo.findById('u-3');
  assertEquals(uDb?.requiere2fa, true);
  assertEquals(uDb?.totpSecret, 'TESTSECRET');

  assertEquals(auditor.eventos.length, 1);
  assertEquals(auditor.eventos[0].accion, 'usuario_2fa_activado');
  // Regla 5 GEMINI.md: NUNCA auditar el secreto TOTP
  assertEquals(auditor.eventos[0].detalles?.totpSecret, undefined);
});

Deno.test('RF-SA-D5 y RF-SA-D12: LoginUseCase detecta 2FA y emite Requiere2FAError con tempToken', async () => {
  const userRepo = new FakeUsuarioRepository();
  const usuario = createMockUsuario({
    id: 'u-4',
    email: 'superadmin@warengine.local',
    passwordHash: 'hashed_clave123',
    requiere2fa: true,
  });
  userRepo.usuarios.set('u-4', usuario);

  const passwordService: IPasswordService = {
    comparar: (p, _h) => Promise.resolve(p === 'clave123'),
    hashear: (p) => Promise.resolve(`hashed_${p}`),
  };

  const tokenService = new FakeTokenService();
  const intentos: { email: string; exitoso: boolean }[] = [];
  const registroIntentos: IRegistroIntentosLogin = {
    registrar: (d) => {
      intentos.push({ email: d.email, exitoso: d.exitoso });
      return Promise.resolve();
    },
  };

  const controlIntentos = {
    contarFallosRecientesPorEmail: () => Promise.resolve(0),
    contarFallosRecientesPorIp: () => Promise.resolve(0),
  };

  const loginUseCase = new LoginUseCase(
    userRepo,
    passwordService,
    tokenService,
    registroIntentos,
    controlIntentos,
    new FakeRolRepository(),
  );

  const res = await loginUseCase.execute({
    email: 'superadmin@warengine.local',
    passwordPlain: 'clave123',
  });

  assert(res.isFailure);
  assertEquals(res.error.code, 'REQUIERE_2FA');
  const req2faError = res.error as Requiere2FAError;
  assertEquals(req2faError.tempToken, 'temp_2fa_u-4');
});

Deno.test('RF-SA-D5: LoginUseCase exitoso retorna objeto enriquecido (usuario, rol, permisos)', async () => {
  const userRepo = new FakeUsuarioRepository();
  const usuario = createMockUsuario({
    id: 'u-5',
    email: 'cajero@warengine.local',
    passwordHash: 'hashed_clave123',
    rolId: 1,
    requiere2fa: false,
  });
  userRepo.usuarios.set('u-5', usuario);

  const passwordService: IPasswordService = {
    comparar: (p, _h) => Promise.resolve(p === 'clave123'),
    hashear: (p) => Promise.resolve(`hashed_${p}`),
  };

  const tokenService = new FakeTokenService();
  const registroIntentos: IRegistroIntentosLogin = {
    registrar: () => Promise.resolve(),
  };
  const controlIntentos = {
    contarFallosRecientesPorEmail: () => Promise.resolve(0),
    contarFallosRecientesPorIp: () => Promise.resolve(0),
  };

  const loginUseCase = new LoginUseCase(
    userRepo,
    passwordService,
    tokenService,
    registroIntentos,
    controlIntentos,
    new FakeRolRepository(),
  );

  const res = await loginUseCase.execute({
    email: 'cajero@warengine.local',
    passwordPlain: 'clave123',
  });

  assert(res.isSuccess);
  assertEquals(res.value.accessToken, 'at_u-5_1');
  assertEquals(res.value.refreshToken, 'rt_u-5');
  assertEquals(res.value.usuario.id, 'u-5');
  assertEquals(res.value.usuario.email, 'cajero@warengine.local');
  assertEquals(res.value.usuario.rolNombre, 'super-admin');
  assertEquals(res.value.permisos, ['facturacion:facturar', 'inventario:leer']);
});

Deno.test('RF-SA-D12: Verificar2FALoginUseCase completa el paso 2 y emite sesión enriquecida', async () => {
  const userRepo = new FakeUsuarioRepository();
  const usuario = createMockUsuario({
    id: 'u-6',
    email: 'admin2fa@warengine.local',
    rolId: 1,
    requiere2fa: true,
    totpSecret: 'SECRET2FA',
  });
  userRepo.usuarios.set('u-6', usuario);

  const mockTotp: ITotpService = {
    generarSecreto: () => ({ secretBase32: '', otpauthUrl: '' }),
    validarCodigo: (secret, code) => Promise.resolve(secret === 'SECRET2FA' && code === '123456'),
  };

  const tokenService = new FakeTokenService();
  const intentos: { email: string; exitoso: boolean }[] = [];
  const registroIntentos: IRegistroIntentosLogin = {
    registrar: (d) => {
      intentos.push({ email: d.email, exitoso: d.exitoso });
      return Promise.resolve();
    },
  };

  const useCase = new Verificar2FALoginUseCase(
    userRepo,
    mockTotp,
    tokenService,
    registroIntentos,
    new FakeRolRepository(),
  );

  // Código inválido
  const fallido = await useCase.execute({
    tempToken: 'temp_2fa_u-6',
    codigoTotp: '000000',
  });
  assert(fallido.isFailure);
  assertEquals(fallido.error.code, 'CODIGO_TOTP_INVALIDO');
  assertEquals(intentos[intentos.length - 1].exitoso, false);

  // Código válido
  const exitoso = await useCase.execute({
    tempToken: 'temp_2fa_u-6',
    codigoTotp: '123456',
  });
  assert(exitoso.isSuccess);
  assertEquals(exitoso.value.usuario.id, 'u-6');
  assertEquals(exitoso.value.usuario.rolNombre, 'super-admin');
  assertEquals(exitoso.value.permisos, ['facturacion:facturar', 'inventario:leer']);
  assertEquals(intentos[intentos.length - 1].exitoso, true);
});

Deno.test('RF-SA-D12: Desactivar2FAUseCase desactiva 2FA confirmando contraseña', async () => {
  const userRepo = new FakeUsuarioRepository();
  const usuario = createMockUsuario({
    id: 'u-7',
    email: 'desactivar@warengine.local',
    passwordHash: 'hashed_miclave',
    requiere2fa: true,
    totpSecret: 'SECRETO',
  });
  userRepo.usuarios.set('u-7', usuario);

  const passwordService: IPasswordService = {
    comparar: (p, _h) => Promise.resolve(p === 'miclave'),
    hashear: (p) => Promise.resolve(`hashed_${p}`),
  };

  const auditor = new FakeAuditor();
  const useCase = new Desactivar2FAUseCase(userRepo, passwordService, auditor);

  // Clave errónea
  const resErr = await useCase.execute({
    usuarioId: 'u-7',
    passwordConfirmacion: 'clave_incorrecta',
  });
  assert(resErr.isFailure);
  assertEquals(resErr.error.code, 'CREDENCIALES_INVALIDAS');

  // Clave correcta
  const resOk = await useCase.execute({
    usuarioId: 'u-7',
    passwordConfirmacion: 'miclave',
    actor: { usuarioId: 'u-7', ip: '127.0.0.1' },
  });

  assert(resOk.isSuccess);

  const uDb = await userRepo.findById('u-7');
  assertEquals(uDb?.requiere2fa, false);
  assertEquals(uDb?.totpSecret, null);
  assertEquals(auditor.eventos.length, 1);
  assertEquals(auditor.eventos[0].accion, 'usuario_2fa_desactivado');
});
