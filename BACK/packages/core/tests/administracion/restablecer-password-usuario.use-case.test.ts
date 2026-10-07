/**
 * restablecer-password-usuario.use-case.test.ts — RF-ADM-C9: el Super Admin restablece la
 * contraseña de un usuario. Repositorios falsos en memoria (sin tocar MySQL ni Argon2).
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ActorAuditoria,
  EventoAuditoria,
  IAuditor,
  IGestionUsuarioRepository,
  IPasswordService,
  RestablecerPasswordUsuarioUseCase,
  UsuarioGestionado,
} from '../../mod.ts';

const actor: ActorAuditoria = { usuarioId: 'super-1', ip: '10.0.0.5' };

function auditorFalso() {
  const eventos: EventoAuditoria[] = [];
  const auditor: IAuditor = { registrar: (e) => { eventos.push(e); return Promise.resolve(); } };
  return { auditor, eventos };
}

interface LlamadaPassword { id: string; hash: string; invalidarEn: Date }

function usuariosFalsos(existente: UsuarioGestionado | null) {
  const llamadas: LlamadaPassword[] = [];
  const repo: IGestionUsuarioRepository = {
    listar: () => Promise.resolve([]),
    findById: () => Promise.resolve(existente),
    existeEmail: () => Promise.resolve(false),
    existeDocumento: () => Promise.resolve(false),
    rolExiste: () => Promise.resolve(true),
    contarSuperAdminsActivos: () => Promise.resolve(2),
    crear: () => Promise.reject(new Error('no se usa')),
    actualizarRol: () => Promise.resolve(),
    actualizarEstado: () => Promise.resolve(),
    actualizarPassword: (id, hash, invalidarEn) => {
      llamadas.push({ id, hash, invalidarEn });
      return Promise.resolve();
    },
  };
  return { repo, llamadas };
}

const hasher: IPasswordService = {
  comparar: () => Promise.resolve(true),
  hashear: (p) => Promise.resolve(`hash-de-${p}`),
};

const usuario = (isActive = true) =>
  new UsuarioGestionado('u-9', 'Luis', 'luis@warengine.local', 3, 'cajero-vendedor', 1, 'Centro', isActive);

Deno.test('RestablecerPassword: guarda el HASH (no el texto plano) e invalida las sesiones', async () => {
  const { repo, llamadas } = usuariosFalsos(usuario());
  const { auditor } = auditorFalso();
  const antes = Date.now();

  const result = await new RestablecerPasswordUsuarioUseCase(repo, hasher, auditor)
    .execute({ usuarioId: 'u-9', nuevaPassword: 'Temporal.2026', actor });

  assertEquals(result.isSuccess, true);
  assertEquals(llamadas.length, 1);
  assertEquals(llamadas[0].id, 'u-9');
  assertEquals(llamadas[0].hash, 'hash-de-Temporal.2026');
  assertEquals(llamadas[0].hash === 'Temporal.2026', false);
  assertEquals(llamadas[0].invalidarEn.getTime() >= antes, true);
});

Deno.test('RestablecerPassword: registra la auditoría SIN contraseña ni hash', async () => {
  const { repo } = usuariosFalsos(usuario());
  const { auditor, eventos } = auditorFalso();

  await new RestablecerPasswordUsuarioUseCase(repo, hasher, auditor)
    .execute({ usuarioId: 'u-9', nuevaPassword: 'Temporal.2026', actor });

  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'restablecer_password');
  assertEquals(eventos[0].entidad, 'usuarios');
  assertEquals(eventos[0].entidadId, 'u-9');
  assertEquals(eventos[0].actor, actor);
  const texto = JSON.stringify(eventos[0]);
  assertEquals(texto.includes('Temporal.2026'), false);
  assertEquals(texto.includes('hash-de-'), false);
});

Deno.test('RestablecerPassword: falla si el usuario no existe y no toca nada', async () => {
  const { repo, llamadas } = usuariosFalsos(null);
  const { auditor, eventos } = auditorFalso();

  const result = await new RestablecerPasswordUsuarioUseCase(repo, hasher, auditor)
    .execute({ usuarioId: 'no-existe', nuevaPassword: 'Temporal.2026', actor });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_NO_ENCONTRADO');
  assertEquals(llamadas.length, 0);
  assertEquals(eventos.length, 0);
});

Deno.test('RestablecerPassword: permite restablecer a un usuario inactivo', async () => {
  const { repo, llamadas } = usuariosFalsos(usuario(false));
  const { auditor } = auditorFalso();

  const result = await new RestablecerPasswordUsuarioUseCase(repo, hasher, auditor)
    .execute({ usuarioId: 'u-9', nuevaPassword: 'Temporal.2026', actor });

  assertEquals(result.isSuccess, true);
  assertEquals(llamadas.length, 1);
});