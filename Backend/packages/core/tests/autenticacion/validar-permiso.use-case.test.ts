/**
 * validar-permiso.use-case.test.ts — Pruebas unitarias del ValidarPermisoUseCase.
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ValidarPermisoUseCase,
  IUsuarioRepository,
  IRolRepository,
  ITokenService,
  AuthTokens,
  AccessTokenPayload,
  Usuario,
  IAuditor,
  EventoAuditoria,
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
} from '../../mod.ts';

// ─── Factories de mocks ──────────────────────────────────────────────────────

function makePayload(overrides: Partial<AccessTokenPayload> = {}): AccessTokenPayload {
  return {
    usuarioId: overrides.usuarioId ?? 'uuid-001',
    rolId: overrides.rolId ?? 1,
    iat: overrides.iat ?? new Date('2026-01-01T00:00:00Z'),
  };
}

function makeTokenService(payload: AccessTokenPayload, failValidation = false): ITokenService {
  return {
    generarTokens: (_id: string, _rolId: number): Promise<AuthTokens> =>
      Promise.resolve({ accessToken: '', refreshToken: '' }),
    validarAccessToken: (_t: string) => {
      if (failValidation) return Promise.reject(new Error('Token inválido'));
      return Promise.resolve(payload);
    },
    validarRefreshToken: (_t: string) => Promise.resolve({ usuarioId: payload.usuarioId }),
    revocarRefreshToken: (_t: string) => Promise.resolve(),
  };
}

function makeUsuario(invalidadoEn: Date | null = null): Usuario {
  return new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, true, false, invalidadoEn);
}

function makeUsuarioRepository(usuario: Usuario | null): IUsuarioRepository {
  return {
    findByEmail: (_email: string) => Promise.resolve(usuario),
    findById: (_id: string) => Promise.resolve(usuario),
  };
}

function makeRolRepository(permisos: string[]): IRolRepository {
  return {
    obtenerPermisosDeRol: (_rolId: number) => Promise.resolve(permisos),
  };
}

function makeAuditor() {
  const eventos: EventoAuditoria[] = [];
  const auditor: IAuditor = {
    registrar: (e) => {
      eventos.push(e);
      return Promise.resolve();
    },
  };
  return { auditor, eventos };
}

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('ValidarPermisoUseCase: aprueba si el usuario tiene el permiso requerido y NO registra auditoría', async () => {
  const payload = makePayload();
  const { auditor, eventos } = makeAuditor();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(makeUsuario()),
    makeRolRepository(['facturacion:facturar', 'inventario:leer']),
    auditor,
  );

  const result = await useCase.execute({
    accessToken: 'valid_token',
    permisoRequerido: 'facturacion:facturar',
    ip: '192.168.1.5',
    metodo: 'POST',
    ruta: '/api/facturas',
  });

  assertEquals(result.isSuccess, true);
  assertEquals(eventos.length, 0); // Con permiso no se genera evento
});

Deno.test('ValidarPermisoUseCase: rechaza con PERMISO_DENEGADO y REGISTRA acceso_denegado', async () => {
  const payload = makePayload();
  const { auditor, eventos } = makeAuditor();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(makeUsuario()),
    makeRolRepository(['inventario:leer']), // no incluye facturacion:facturar
    auditor,
  );

  const result = await useCase.execute({
    accessToken: 'valid_token',
    permisoRequerido: 'facturacion:facturar',
    ip: '192.168.1.100',
    metodo: 'POST',
    ruta: '/api/facturacion/facturas',
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'PERMISO_DENEGADO');

  // Verifica el registro de acceso denegado
  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, ACCIONES_AUDITORIA.ACCESO_DENEGADO);
  assertEquals(eventos[0].entidad, ENTIDADES_AUDITORIA.ACCESO);
  assertEquals(eventos[0].entidadId, null);
  assertEquals(eventos[0].actor, { usuarioId: 'uuid-001', ip: '192.168.1.100' });
  assertEquals(eventos[0].detalles, {
    permisoRequerido: 'facturacion:facturar',
    metodo: 'POST',
    ruta: '/api/facturacion/facturas',
  });
});

Deno.test('ValidarPermisoUseCase: rechaza con TOKEN_INVALIDO si el JWT es inválido y NO registra auditoría', async () => {
  const payload = makePayload();
  const { auditor, eventos } = makeAuditor();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload, true), // simula token inválido
    makeUsuarioRepository(makeUsuario()),
    makeRolRepository([]),
    auditor,
  );

  const result = await useCase.execute({ accessToken: 'bad_token', permisoRequerido: 'inventario:leer' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'TOKEN_INVALIDO');
  assertEquals(eventos.length, 0); // No hay usuario validado
});

Deno.test('ValidarPermisoUseCase: rechaza con TOKEN_INVALIDO si las credenciales fueron invalidadas', async () => {
  const fechaInvalidacion = new Date('2026-06-01T12:00:00Z');
  const tokenIat = new Date('2026-06-01T10:00:00Z');

  const payload = makePayload({ iat: tokenIat });
  const usuarioConInvalidacion = makeUsuario(fechaInvalidacion);
  const { auditor, eventos } = makeAuditor();

  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(usuarioConInvalidacion),
    makeRolRepository(['inventario:leer']),
    auditor,
  );

  const result = await useCase.execute({ accessToken: 'stale_token', permisoRequerido: 'inventario:leer' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'TOKEN_INVALIDO');
  assertEquals(eventos.length, 0);
});

Deno.test('ValidarPermisoUseCase: aprueba sin verificar permisos si no se requiere permiso específico', async () => {
  const payload = makePayload();
  const { auditor, eventos } = makeAuditor();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(makeUsuario()),
    makeRolRepository([]),
    auditor,
  );

  const result = await useCase.execute({ accessToken: 'valid_token' });

  assertEquals(result.isSuccess, true);
  assertEquals(eventos.length, 0);
});

Deno.test('ValidarPermisoUseCase: rechaza con USUARIO_INACTIVO si el usuario está desactivado', async () => {
  const payload = makePayload();
  const usuarioInactivo = new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, false, false, null);
  const { auditor, eventos } = makeAuditor();
  const useCase = new ValidarPermisoUseCase(
    makeTokenService(payload),
    makeUsuarioRepository(usuarioInactivo),
    makeRolRepository(['inventario:leer']),
    auditor,
  );

  const result = await useCase.execute({ accessToken: 'valid_token', permisoRequerido: 'inventario:leer' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_INACTIVO');
  assertEquals(eventos.length, 0);
});
