import { assertEquals, assert } from 'jsr:@std/assert@^1';
import {
  ForgotPasswordUseCase,
  VerifyCodeUseCase,
  ResetPasswordUseCase,
  IUsuarioRepository,
  IPasswordResetRepository,
  PasswordResetOtpRecord,
  ResultadoVerificacionOtp,
  IRefreshTokenRepository,
  IOtpMailer,
  EnviarEmailOtpDto,
  IPasswordService,
  Usuario,
  IAuditor,
  LogAuditoria,
} from '../../mod.ts';

// ─── Mocks de Puertos (Ports) ────────────────────────────────────────────────

function makeUsuario(overrides: Partial<ConstructorParameters<typeof Usuario>> = []): Usuario {
  return new Usuario(
    overrides[0] ?? 'usr-test-1',
    overrides[1] ?? 'admin@warengine.local',
    overrides[2] ?? '$argon2id$v=19$m=65536,t=3,p=4$mockhash',
    overrides[3] ?? 1,
    overrides[4] ?? true,
    overrides[5] ?? false,
    overrides[6] ?? null,
  );
}

function makeUsuarioRepository(
  usuario: Usuario | null,
  onActualizarPassword?: (id: string, hash: string, tokensInvalidadosEn: Date) => void,
): IUsuarioRepository {
  return {
    findByEmail: (email: string) =>
      Promise.resolve(usuario && usuario.email.toLowerCase() === email.toLowerCase() ? usuario : null),
    findById: (id: string) =>
      Promise.resolve(usuario && usuario.id === id ? usuario : null),
    actualizarPassword: (id: string, hash: string, date: Date) => {
      onActualizarPassword?.(id, hash, date);
      return Promise.resolve();
    },
  };
}

function makeOtpMailer(): { mailer: IOtpMailer; envios: EnviarEmailOtpDto[] } {
  const envios: EnviarEmailOtpDto[] = [];
  return {
    mailer: {
      enviarCodigoOtp: (dto: EnviarEmailOtpDto) => {
        envios.push(dto);
        return Promise.resolve();
      },
    },
    envios,
  };
}

function makeRefreshTokenRepository(): {
  repo: IRefreshTokenRepository;
  revocadosPorUsuario: string[];
} {
  const revocadosPorUsuario: string[] = [];
  return {
    repo: {
      guardar: () => Promise.resolve(),
      validar: () => Promise.resolve(null),
      revocar: () => Promise.resolve(),
      revocarTodosPorUsuario: (usuarioId: string) => {
        revocadosPorUsuario.push(usuarioId);
        return Promise.resolve();
      },
    },
    revocadosPorUsuario,
  };
}

function makeAuditor(): { auditor: IAuditor; logs: LogAuditoria[] } {
  const logs: LogAuditoria[] = [];
  return {
    auditor: {
      registrar: (log) => {
        logs.push(
          new LogAuditoria(
            `log-${logs.length + 1}`,
            log.actor.usuarioId,
            'Actor',
            log.accion,
            log.entidad,
            log.entidadId ?? null,
            (log.detalles as Record<string, unknown>) ?? null,
            log.actor.ip ?? null,
            new Date(),
          ),
        );
        return Promise.resolve();
      },
    },
    logs,
  };
}

function makePasswordResetRepositoryMock() {
  const registros: PasswordResetOtpRecord[] = [];

  const repo: IPasswordResetRepository = {
    obtenerUltimaSolicitudPorEmail: (email: string) => {
      const filtrados = registros.filter((r) => r.email === email.toLowerCase());
      return Promise.resolve(filtrados[filtrados.length - 1] ?? null);
    },
    guardarOtp: (usuarioId: string, email: string, codeHash: string, expiresAt: Date) => {
      // Invalida anteriores
      for (const r of registros) {
        if (r.email === email.toLowerCase()) {
          r.used = true;
        }
      }
      const nuevo: PasswordResetOtpRecord = {
        id: registros.length + 1,
        usuarioId,
        email: email.toLowerCase(),
        codeHash,
        attempts: 0,
        expiresAt,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        used: false,
        createdAt: new Date(),
      };
      registros.push(nuevo);
      return Promise.resolve(nuevo.id);
    },
    verificarOtpConLock: (email: string, verificador: (hash: string) => boolean) => {
      const reg = registros.slice().reverse().find((r) => r.email === email.toLowerCase());
      if (!reg) return Promise.resolve({ exito: false, motivo: 'NO_ENCONTRADO' as const });
      if (reg.used) return Promise.resolve({ exito: false, motivo: 'YA_USADO' as const });
      if (reg.attempts >= 5) return Promise.resolve({ exito: false, motivo: 'BLOQUEADO' as const });
      if (new Date() > reg.expiresAt) return Promise.resolve({ exito: false, motivo: 'EXPIRADO' as const });

      const correcto = verificador(reg.codeHash!);
      if (!correcto) {
        reg.attempts += 1;
        if (reg.attempts >= 5) {
          return Promise.resolve({ exito: false, motivo: 'BLOQUEADO' as const, intentosRestantes: 0 });
        }
        return Promise.resolve({
          exito: false,
          motivo: 'CODIGO_INCORRECTO' as const,
          intentosRestantes: 5 - reg.attempts,
        });
      }

      return Promise.resolve({
        exito: true,
        resetId: reg.id,
        usuarioId: reg.usuarioId,
      });
    },
    asignarResetToken: (id: number, resetTokenHash: string, resetTokenExpiresAt: Date) => {
      const reg = registros.find((r) => r.id === id);
      if (reg) {
        reg.resetTokenHash = resetTokenHash;
        reg.resetTokenExpiresAt = resetTokenExpiresAt;
      }
      return Promise.resolve();
    },
    buscarPorResetTokenHash: (resetTokenHash: string) => {
      const reg = registros.find((r) => r.resetTokenHash === resetTokenHash && !r.used);
      return Promise.resolve(reg ?? null);
    },
    marcarTodosComoUsadosPorUsuario: (usuarioId: string) => {
      for (const r of registros) {
        if (r.usuarioId === usuarioId) {
          r.used = true;
        }
      }
      return Promise.resolve();
    },
    // Métodos legacy
    guardar: () => Promise.resolve(),
    buscarTokenValido: () => Promise.resolve(null),
    marcarComoUsado: (id) => {
      const reg = registros.find((r) => r.id === Number(id));
      if (reg) reg.used = true;
      return Promise.resolve();
    },
    contarSolicitudesRecientesPorUsuario: () => Promise.resolve(0),
  };

  return { repo, registros };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('1. POST /forgot-password — Devuelve éxito genérico tanto si el usuario existe como si no (Anti-enumeración)', async () => {
  const { repo } = makePasswordResetRepositoryMock();
  const { mailer, envios } = makeOtpMailer();
  const { auditor } = makeAuditor();
  const usuarioActivo = makeUsuario();
  const usuarioRepo = makeUsuarioRepository(usuarioActivo);

  const useCase = new ForgotPasswordUseCase(
    usuarioRepo,
    repo,
    mailer,
    auditor,
    () => '1234',
    (c, e) => `hash-${e}-${c}`,
  );

  // Email existente y activo -> genera y envía
  const resExiste = await useCase.execute({ email: 'admin@warengine.local' });
  assertEquals(resExiste.isSuccess, true);
  assertEquals(envios.length, 1);
  assertEquals(envios[0].codigoOtp, '1234');

  // Email inexistente -> respuesta idéntica, no envía correo
  const resInexistente = await useCase.execute({ email: 'no-existe@warengine.local' });
  assertEquals(resInexistente.isSuccess, true);
  assertEquals(resInexistente.value.mensaje, resExiste.value.mensaje);
  assertEquals(envios.length, 1); // No aumentó
});

Deno.test('2. POST /forgot-password — Rechaza reenvío antes del cooldown de 60s', async () => {
  const { repo } = makePasswordResetRepositoryMock();
  const { mailer } = makeOtpMailer();
  const { auditor } = makeAuditor();
  const usuario = makeUsuario();
  const usuarioRepo = makeUsuarioRepository(usuario);

  const useCase = new ForgotPasswordUseCase(
    usuarioRepo,
    repo,
    mailer,
    auditor,
    () => '5555',
    (c, e) => `hash-${e}-${c}`,
  );

  const res1 = await useCase.execute({ email: 'admin@warengine.local' });
  assertEquals(res1.isSuccess, true);

  // Reintento inmediato (menos de 60 segundos)
  const res2 = await useCase.execute({ email: 'admin@warengine.local' });
  assertEquals(res2.isFailure, true);
  assertEquals(res2.error.code, 'REENVIO_EN_COOLDOWN');
});

Deno.test('3. POST /verify-code — Código correcto devuelve resetToken temporal válido por 15 min', async () => {
  const { repo } = makePasswordResetRepositoryMock();
  const { mailer } = makeOtpMailer();
  const { auditor } = makeAuditor();
  const usuario = makeUsuario();
  const usuarioRepo = makeUsuarioRepository(usuario);

  const forgotUseCase = new ForgotPasswordUseCase(
    usuarioRepo,
    repo,
    mailer,
    auditor,
    () => '7890',
    (c) => `mockhash-${c}`,
  );
  await forgotUseCase.execute({ email: 'admin@warengine.local' });

  const verifyUseCase = new VerifyCodeUseCase(
    repo,
    (codigo, _email, hashGuardado) => hashGuardado === `mockhash-${codigo}`,
    () => 'a'.repeat(64),
    (t) => `hash-${t}`,
  );

  const res = await verifyUseCase.execute({ email: 'admin@warengine.local', code: '7890' });
  assertEquals(res.isSuccess, true);
  assertEquals(res.value.resetToken, 'a'.repeat(64));
  assertEquals(res.value.expiraEnMinutos, 15);
});

Deno.test('4. POST /verify-code — Código incorrecto disminuye intentos restantes y bloquea tras 5 fallos', async () => {
  const { repo } = makePasswordResetRepositoryMock();
  const { mailer } = makeOtpMailer();
  const { auditor } = makeAuditor();
  const usuario = makeUsuario();
  const usuarioRepo = makeUsuarioRepository(usuario);

  const forgotUseCase = new ForgotPasswordUseCase(
    usuarioRepo,
    repo,
    mailer,
    auditor,
    () => '9999',
    (c) => `mockhash-${c}`,
  );
  await forgotUseCase.execute({ email: 'admin@warengine.local' });

  const verifyUseCase = new VerifyCodeUseCase(
    repo,
    (codigo, _email, hashGuardado) => hashGuardado === `mockhash-${codigo}`,
    () => 'b'.repeat(64),
    (t) => `hash-${t}`,
  );

  // Intentos fallidos 1 a 4
  for (let i = 1; i <= 4; i++) {
    const res = await verifyUseCase.execute({ email: 'admin@warengine.local', code: '0000' });
    assertEquals(res.isFailure, true);
    assertEquals(res.error.code, 'CODIGO_OTP_INVALIDO');
  }

  // Intento 5: bloqueo definitivo
  const res5 = await verifyUseCase.execute({ email: 'admin@warengine.local', code: '0000' });
  assertEquals(res5.isFailure, true);
  assertEquals(res5.error.code, 'CODIGO_OTP_BLOQUEADO');

  // Incluso con el código correcto posterior, permanece bloqueado
  const resPostBloqueo = await verifyUseCase.execute({ email: 'admin@warengine.local', code: '9999' });
  assertEquals(resPostBloqueo.isFailure, true);
  assertEquals(resPostBloqueo.error.code, 'CODIGO_OTP_BLOQUEADO');
});

Deno.test('5. POST /verify-code — Falla si el código ha expirado (más de 10 min)', async () => {
  const { repo, registros } = makePasswordResetRepositoryMock();
  const { mailer } = makeOtpMailer();
  const { auditor } = makeAuditor();
  const usuario = makeUsuario();
  const usuarioRepo = makeUsuarioRepository(usuario);

  const forgotUseCase = new ForgotPasswordUseCase(
    usuarioRepo,
    repo,
    mailer,
    auditor,
    () => '4321',
    (c) => `mockhash-${c}`,
  );
  await forgotUseCase.execute({ email: 'admin@warengine.local' });

  // Simulamos expiración modificando expiresAt en el registro
  registros[0].expiresAt = new Date(Date.now() - 1000);

  const verifyUseCase = new VerifyCodeUseCase(
    repo,
    (codigo, _email, hashGuardado) => hashGuardado === `mockhash-${codigo}`,
    () => 'c'.repeat(64),
    (t) => `hash-${t}`,
  );

  const res = await verifyUseCase.execute({ email: 'admin@warengine.local', code: '4321' });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CODIGO_OTP_EXPIRADO');
});

Deno.test('6. POST /reset-password — Cambia contraseña, revoca refresh_tokens y marca tokens usados', async () => {
  const { repo, registros } = makePasswordResetRepositoryMock();
  const { mailer } = makeOtpMailer();
  const { auditor } = makeAuditor();
  const { repo: refreshRepo, revocadosPorUsuario } = makeRefreshTokenRepository();

  let passwordActualizada = false;
  let tokensInvalidadosEn: Date | null = null;
  const usuario = makeUsuario();
  const usuarioRepo = makeUsuarioRepository(usuario, (_id, _hash, date) => {
    passwordActualizada = true;
    tokensInvalidadosEn = date;
  });

  const passwordService: IPasswordService = {
    comparar: () => Promise.resolve(true),
    hashear: (plain: string) => Promise.resolve(`argon2id-hash-de-${plain}`),
  };

  const rawResetToken = '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef';
  const tokenHash = `hash-${rawResetToken}`;

  // Preparamos un registro verificado listo para reset
  registros.push({
    id: 1,
    usuarioId: usuario.id,
    email: usuario.email,
    codeHash: 'some-code-hash',
    attempts: 0,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
    resetTokenHash: tokenHash,
    resetTokenExpiresAt: new Date(Date.now() + 15 * 60 * 1000),
    used: false,
    createdAt: new Date(),
  });

  const resetUseCase = new ResetPasswordUseCase(
    repo,
    refreshRepo,
    usuarioRepo,
    passwordService,
    auditor,
    (t) => `hash-${t}`,
  );

  const res = await resetUseCase.execute({
    resetToken: rawResetToken,
    newPassword: 'NuevaPasswordSegura2026!',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(passwordActualizada, true);
  assert(tokensInvalidadosEn !== null);
  assertEquals(registros[0].used, true);
  assertEquals(revocadosPorUsuario, [usuario.id]);

  // Reutilización del mismo resetToken es rechazada
  const resReutilizado = await resetUseCase.execute({
    resetToken: rawResetToken,
    newPassword: 'OtraPasswordSegura2026!',
  });
  assertEquals(resReutilizado.isFailure, true);
  assertEquals(resReutilizado.error.code, 'RESET_TOKEN_INVALIDO');
});
