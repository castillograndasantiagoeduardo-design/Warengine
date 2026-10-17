import { assertEquals } from 'jsr:@std/assert@^1';
import {
  SolicitarRecuperacionPasswordUseCase,
  ValidarTokenPasswordResetUseCase,
  RestablecerPasswordUseCase,
  IUsuarioRepository,
  IPasswordResetRepository,
  PasswordResetTokenInfo,
  IMailer,
  EnviarEmailRecuperacionDto,
  IPasswordService,
  Usuario,
  IAuditor,
  LogAuditoria,
} from '../../mod.ts';

// ─── Mocks manuales (Ports) ──────────────────────────────────────────────────

function makeUsuario(overrides: Partial<ConstructorParameters<typeof Usuario>> = []): Usuario {
  return new Usuario(
    overrides[0] ?? 'usr-uuid-1',
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
      Promise.resolve(usuario && usuario.email === email ? usuario : null),
    findById: (id: string) =>
      Promise.resolve(usuario && usuario.id === id ? usuario : null),
    actualizarPassword: (id: string, hash: string, date: Date) => {
      onActualizarPassword?.(id, hash, date);
      return Promise.resolve();
    },
  };
}

function makePasswordResetRepository(initialTokens: PasswordResetTokenInfo[] = []): {
  repo: IPasswordResetRepository;
  tokens: PasswordResetTokenInfo[];
  guardados: { usuarioId: string; token: string; expiraEn: Date }[];
} {
  const tokens = [...initialTokens];
  const guardados: { usuarioId: string; token: string; expiraEn: Date }[] = [];

  const repo: IPasswordResetRepository = {
    guardar: (usuarioId: string, token: string, expiraEn: Date) => {
      guardados.push({ usuarioId, token, expiraEn });
      tokens.push({
        id: `token-id-${tokens.length + 1}`,
        usuarioId,
        expiraEn,
        usado: false,
      });
      return Promise.resolve();
    },
    buscarTokenValido: (token: string) => {
      // Simulación de búsqueda por hash
      const t = tokens.find((tok) => tok.id === token || tok.usuarioId === token);
      return Promise.resolve(t ?? null);
    },
    marcarComoUsado: (id: string) => {
      const t = tokens.find((tok) => tok.id === id);
      if (t) {
        t.usado = true;
      }
      return Promise.resolve();
    },
    contarSolicitudesRecientesPorUsuario: (usuarioId: string, desde: Date) => {
      const count = tokens.filter(
        (tok) => tok.usuarioId === usuarioId && tok.expiraEn >= desde,
      ).length;
      return Promise.resolve(count);
    },
  };

  return { repo, tokens, guardados };
}

function makeMailer(): { mailer: IMailer; emails: EnviarEmailRecuperacionDto[] } {
  const emails: EnviarEmailRecuperacionDto[] = [];
  return {
    mailer: {
      enviarEmailRecuperacionPassword: (dto: EnviarEmailRecuperacionDto) => {
        emails.push(dto);
        return Promise.resolve();
      },
    },
    emails,
  };
}

function makeAuditor(): { auditor: IAuditor; logs: unknown[] } {
  const logs: unknown[] = [];
  return {
    auditor: {
      registrar: (evento: unknown) => {
        logs.push(evento);
        return Promise.resolve();
      },
    } as unknown as IAuditor,
    logs,
  };
}

function makePasswordService(): IPasswordService {
  return {
    comparar: () => Promise.resolve(true),
    hashear: (plain: string) => Promise.resolve(`argon2id_hashed_${plain}`),
  };
}

// ─── Tests: SolicitarRecuperacionPasswordUseCase ─────────────────────────────

Deno.test('RF-SA-H1: Solicitar recuperación envía correo si el usuario existe y está activo', async () => {
  const usuario = makeUsuario();
  const usuarioRepo = makeUsuarioRepository(usuario);
  const { repo: pwRepo, guardados } = makePasswordResetRepository();
  const { mailer, emails } = makeMailer();
  const { auditor, logs } = makeAuditor();

  const useCase = new SolicitarRecuperacionPasswordUseCase(usuarioRepo, pwRepo, mailer, auditor);

  const res = await useCase.execute({
    email: 'admin@warengine.local',
    ip: '127.0.0.1',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(emails.length, 1);
  assertEquals(emails[0].para, 'admin@warengine.local');
  assertEquals(emails[0].expiraEnMinutos, 30);
  assertEquals(guardados.length, 1);
  assertEquals(logs.length, 1);
});

Deno.test('RF-SA-H1: Anti-enumeración — si el usuario no existe, devuelve éxito idéntico sin enviar correo', async () => {
  const usuarioRepo = makeUsuarioRepository(null);
  const { repo: pwRepo, guardados } = makePasswordResetRepository();
  const { mailer, emails } = makeMailer();
  const { auditor, logs } = makeAuditor();

  const useCase = new SolicitarRecuperacionPasswordUseCase(usuarioRepo, pwRepo, mailer, auditor);

  const res = await useCase.execute({
    email: 'noexiste@warengine.local',
    ip: '127.0.0.1',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(emails.length, 0); // No envía correo
  assertEquals(guardados.length, 0);
  assertEquals(logs.length, 0);
});

Deno.test('RF-SA-H1: Anti-enumeración — si el usuario está inactivo, devuelve éxito sin enviar correo', async () => {
  const usuarioInactivo = new Usuario(
    'usr-inactivo',
    'inactivo@warengine.local',
    'hash',
    1,
    false, // inactivo
    false,
    null,
  );
  const usuarioRepo = makeUsuarioRepository(usuarioInactivo);
  const { repo: pwRepo, guardados } = makePasswordResetRepository();
  const { mailer, emails } = makeMailer();
  const { auditor } = makeAuditor();

  const useCase = new SolicitarRecuperacionPasswordUseCase(usuarioRepo, pwRepo, mailer, auditor);

  const res = await useCase.execute({
    email: 'inactivo@warengine.local',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(emails.length, 0);
  assertEquals(guardados.length, 0);
});

Deno.test('RF-SA-H2: Límite de solicitudes de recuperación (rate limiting 3 en 15 min)', async () => {
  const usuario = makeUsuario();
  const usuarioRepo = makeUsuarioRepository(usuario);
  // Simular 3 tokens previos emitidos dentro de la ventana
  const tokensPrevios: PasswordResetTokenInfo[] = [
    { id: 't1', usuarioId: usuario.id, expiraEn: new Date(Date.now() + 20 * 60 * 1000), usado: false },
    { id: 't2', usuarioId: usuario.id, expiraEn: new Date(Date.now() + 25 * 60 * 1000), usado: false },
    { id: 't3', usuarioId: usuario.id, expiraEn: new Date(Date.now() + 29 * 60 * 1000), usado: false },
  ];
  const { repo: pwRepo } = makePasswordResetRepository(tokensPrevios);
  const { mailer } = makeMailer();
  const { auditor } = makeAuditor();

  const useCase = new SolicitarRecuperacionPasswordUseCase(usuarioRepo, pwRepo, mailer, auditor);

  const res = await useCase.execute({
    email: 'admin@warengine.local',
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'LIMITE_SOLICITUDES_EXCEDIDO');
});

// ─── Tests: ValidarTokenPasswordResetUseCase ─────────────────────────────────

Deno.test('RF-SA-H4: Validar token aprueba si existe, no está usado y no ha expirado', async () => {
  const tokenValido: PasswordResetTokenInfo = {
    id: 'tok-valido',
    usuarioId: 'usr-1',
    expiraEn: new Date(Date.now() + 10 * 60 * 1000), // En 10 min
    usado: false,
  };
  const { repo: pwRepo } = makePasswordResetRepository([tokenValido]);

  const useCase = new ValidarTokenPasswordResetUseCase(pwRepo);

  const res = await useCase.execute({ token: 'tok-valido' });
  assertEquals(res.isSuccess, true);
  assertEquals(res.value.valido, true);
});

Deno.test('RF-SA-H4: Validar token falla si el token está expirado', async () => {
  const tokenExpirado: PasswordResetTokenInfo = {
    id: 'tok-expirado',
    usuarioId: 'usr-1',
    expiraEn: new Date(Date.now() - 5 * 60 * 1000), // Expiró hace 5 min
    usado: false,
  };
  const { repo: pwRepo } = makePasswordResetRepository([tokenExpirado]);

  const useCase = new ValidarTokenPasswordResetUseCase(pwRepo);

  const res = await useCase.execute({ token: 'tok-expirado' });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'TOKEN_RECUPERACION_INVALIDO');
});

Deno.test('RF-SA-H4: Validar token falla si el token ya fue usado', async () => {
  const tokenUsado: PasswordResetTokenInfo = {
    id: 'tok-usado',
    usuarioId: 'usr-1',
    expiraEn: new Date(Date.now() + 10 * 60 * 1000),
    usado: true,
  };
  const { repo: pwRepo } = makePasswordResetRepository([tokenUsado]);

  const useCase = new ValidarTokenPasswordResetUseCase(pwRepo);

  const res = await useCase.execute({ token: 'tok-usado' });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'TOKEN_RECUPERACION_INVALIDO');
});

// ─── Tests: RestablecerPasswordUseCase ───────────────────────────────────────

Deno.test('RF-SA-H6: Restablecer password rechaza si contraseñas no coinciden', async () => {
  const { repo: pwRepo } = makePasswordResetRepository();
  const usuarioRepo = makeUsuarioRepository(makeUsuario());
  const passwordService = makePasswordService();
  const { auditor } = makeAuditor();

  const useCase = new RestablecerPasswordUseCase(pwRepo, usuarioRepo, passwordService, auditor);

  const res = await useCase.execute({
    token: 'tok-123',
    nuevaPassword: 'Password123!',
    confirmarPassword: 'OtraPasswordDistinta',
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PASSWORDS_NO_COINCIDEN');
});

Deno.test('RF-SA-H6: Restablecer password exitoso actualiza hash, invalida sesiones, marca usado y audita sin secretos', async () => {
  const usuario = makeUsuario();
  let hashActualizado: string | null = null;
  let tokensInvalidadosEn: Date | null = null;

  const usuarioRepo = makeUsuarioRepository(usuario, (_id, hash, date) => {
    hashActualizado = hash;
    tokensInvalidadosEn = date;
  });

  const tokenValido: PasswordResetTokenInfo = {
    id: 'tok-valido-123',
    usuarioId: usuario.id,
    expiraEn: new Date(Date.now() + 20 * 60 * 1000),
    usado: false,
  };

  const { repo: pwRepo, tokens } = makePasswordResetRepository([tokenValido]);
  const passwordService = makePasswordService();
  const { auditor, logs } = makeAuditor();

  const useCase = new RestablecerPasswordUseCase(pwRepo, usuarioRepo, passwordService, auditor);

  const res = await useCase.execute({
    token: 'tok-valido-123',
    nuevaPassword: 'NuevaPasswordSegura2026',
    confirmarPassword: 'NuevaPasswordSegura2026',
    ip: '192.168.1.50',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(hashActualizado, 'argon2id_hashed_NuevaPasswordSegura2026');
  assertEquals(tokensInvalidadosEn !== null, true);

  // Token marcado como usado (RF-SA-H4)
  const tokEnRepo = tokens.find((t) => t.id === 'tok-valido-123');
  assertEquals(tokEnRepo?.usado, true);

  // Auditoría sin contraseñas (Regla 5)
  assertEquals(logs.length, 1);
  const log = logs[0] as {
    accion: string;
    entidad: string;
    detalles: Record<string, unknown>;
  };
  assertEquals(log.accion, 'restablecer_password');
  assertEquals(log.entidad, 'usuarios');
  assertEquals(log.detalles.nuevaPassword, undefined);
  assertEquals(log.detalles.hash, undefined);
});
