/**
 * auditoria-operaciones.use-case.test.ts — RNF-ADM-02: las operaciones de sucursales y usuarios
 * registran quién, qué y sobre qué entidad. Repositorios falsos en memoria.
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ActorAuditoria,
  CambiarEstadoUsuarioUseCase,
  CambiarRolUsuarioUseCase,
  CrearSucursalUseCase,
  CrearUsuarioUseCase,
  DatosSucursal,
  EditarSucursalUseCase,
  EventoAuditoria,
  IAuditor,
  IGestionUsuarioRepository,
  IPasswordService,
  ISucursalRepository,
  NuevoUsuarioData,
  Sucursal,
  UsuarioGestionado,
} from '../../mod.ts';

const actor: ActorAuditoria = { usuarioId: 'super-1', ip: '10.0.0.5' };

function auditorFalso() {
  const eventos: EventoAuditoria[] = [];
  const auditor: IAuditor = { registrar: (e) => { eventos.push(e); return Promise.resolve(); } };
  return { auditor, eventos };
}

function sucursalesFalsas(inicial: Sucursal[] = []): ISucursalRepository {
  const datos = [...inicial];
  return {
    listar: () => Promise.resolve(datos),
    findById: (id) => Promise.resolve(datos.find((s) => s.id === id) ?? null),
    findByNombre: (n) => Promise.resolve(datos.find((s) => s.nombre.toLowerCase() === n.toLowerCase()) ?? null),
    crear: (d: DatosSucursal) => {
      const s = new Sucursal(datos.length + 1, d.nombre, d.direccion ?? null, d.contacto ?? null, true);
      datos.push(s);
      return Promise.resolve(s);
    },
    actualizar: (id, c) => {
      const i = datos.findIndex((s) => s.id === id);
      const o = datos[i];
      datos[i] = new Sucursal(
        id, c.nombre ?? o.nombre, c.direccion ?? o.direccion, c.contacto ?? o.contacto, c.isActive ?? o.isActive,
      );
      return Promise.resolve(datos[i]);
    },
  };
}

function usuario(rolId = 3, rolNombre = 'cajero-vendedor', isActive = true) {
  return new UsuarioGestionado('u-9', 'Luis', 'luis@warengine.local', rolId, rolNombre, 1, 'Centro', isActive);
}

function usuariosFalsos(existente: UsuarioGestionado | null): IGestionUsuarioRepository {
  return {
    listar: () => Promise.resolve([]),
    findById: () => Promise.resolve(existente),
    existeEmail: () => Promise.resolve(false),
    existeDocumento: () => Promise.resolve(false),
    rolExiste: () => Promise.resolve(true),
    contarSuperAdminsActivos: () => Promise.resolve(2),
    crear: (d: NuevoUsuarioData) =>
      Promise.resolve(new UsuarioGestionado('u-new', d.nombre, d.email, d.rolId, 'cajero-vendedor', d.sucursalId, 'Centro', true)),
    actualizarRol: () => Promise.resolve(),
    actualizarEstado: () => Promise.resolve(),
  };
}

const hasher: IPasswordService = {
  comparar: () => Promise.resolve(true),
  hashear: (p) => Promise.resolve(`hash-de-${p}`),
};

Deno.test('CrearSucursal: registra la creación con actor, entidad y datos', async () => {
  const { auditor, eventos } = auditorFalso();
  const result = await new CrearSucursalUseCase(sucursalesFalsas(), auditor)
    .execute({ nombre: 'Sucursal Norte', direccion: 'Calle 1', actor });

  assertEquals(result.isSuccess, true);
  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'crear');
  assertEquals(eventos[0].entidad, 'sucursales');
  assertEquals(eventos[0].entidadId, '1');
  assertEquals(eventos[0].actor, actor);
  assertEquals(eventos[0].detalles?.nombre, 'Sucursal Norte');
});

Deno.test('CrearSucursal: NO registra auditoría si la operación falla (nombre duplicado)', async () => {
  const { auditor, eventos } = auditorFalso();
  const repo = sucursalesFalsas([new Sucursal(1, 'Centro', null, null, true)]);
  const result = await new CrearSucursalUseCase(repo, auditor).execute({ nombre: 'centro', actor });

  assertEquals(result.isFailure, true);
  assertEquals(eventos.length, 0);
});

Deno.test('EditarSucursal: registra solo los campos modificados (antes y después)', async () => {
  const { auditor, eventos } = auditorFalso();
  const repo = sucursalesFalsas([new Sucursal(1, 'Centro', 'Cra 5', '300', true)]);
  await new EditarSucursalUseCase(repo, auditor).execute({ id: 1, direccion: 'Cra 9', actor });

  assertEquals(eventos[0].accion, 'editar');
  assertEquals(eventos[0].detalles, { antes: { direccion: 'Cra 5' }, despues: { direccion: 'Cra 9' } });
});

Deno.test('EditarSucursal: NO registra si la sucursal no existe', async () => {
  const { auditor, eventos } = auditorFalso();
  const result = await new EditarSucursalUseCase(sucursalesFalsas(), auditor)
    .execute({ id: 99, nombre: 'X', actor });

  assertEquals(result.isFailure, true);
  assertEquals(eventos.length, 0);
});

Deno.test('CrearUsuario: registra la creación SIN contraseña ni documento', async () => {
  const { auditor, eventos } = auditorFalso();
  const sucursales = sucursalesFalsas([new Sucursal(1, 'Centro', null, null, true)]);
  const result = await new CrearUsuarioUseCase(usuariosFalsos(null), sucursales, hasher, auditor).execute({
    nombre: 'Marta', tipoDocumento: 'CC', numeroDocumento: '12345678',
    email: 'marta@warengine.local', passwordPlain: 'ClaveSegura1', rolId: 3, sucursalId: 1, actor,
  });

  assertEquals(result.isSuccess, true);
  assertEquals(eventos[0].entidad, 'usuarios');
  assertEquals(eventos[0].entidadId, 'u-new');
  const texto = JSON.stringify(eventos[0]);
  assertEquals(texto.includes('ClaveSegura1'), false);
  assertEquals(texto.includes('hash-de-'), false);
  assertEquals(texto.includes('12345678'), false);
});

Deno.test('CambiarRol: registra rol anterior y nuevo', async () => {
  const { auditor, eventos } = auditorFalso();
  await new CambiarRolUsuarioUseCase(usuariosFalsos(usuario(3)), auditor)
    .execute({ usuarioId: 'u-9', rolId: 2, actor });

  assertEquals(eventos[0].accion, 'cambiar_rol');
  assertEquals(eventos[0].detalles, { rolAnterior: 3, rolNuevo: 2 });
});

Deno.test('CambiarRol: NO registra si el rol es el mismo (sin cambios)', async () => {
  const { auditor, eventos } = auditorFalso();
  await new CambiarRolUsuarioUseCase(usuariosFalsos(usuario(3)), auditor)
    .execute({ usuarioId: 'u-9', rolId: 3, actor });

  assertEquals(eventos.length, 0);
});

Deno.test('CambiarEstado: registra inactivar y activar según corresponda', async () => {
  const { auditor, eventos } = auditorFalso();
  await new CambiarEstadoUsuarioUseCase(usuariosFalsos(usuario(3, 'cajero-vendedor', true)), auditor)
    .execute({ usuarioId: 'u-9', isActive: false, actor });
  await new CambiarEstadoUsuarioUseCase(usuariosFalsos(usuario(3, 'cajero-vendedor', false)), auditor)
    .execute({ usuarioId: 'u-9', isActive: true, actor });

  assertEquals(eventos.map((e) => e.accion), ['inactivar', 'activar']);
});

Deno.test('CambiarEstado: NO registra si el último Super Admin intenta desactivarse', async () => {
  const { auditor, eventos } = auditorFalso();
  const repo = { ...usuariosFalsos(usuario(1, 'super-admin', true)), contarSuperAdminsActivos: () => Promise.resolve(1) };
  const result = await new CambiarEstadoUsuarioUseCase(repo, auditor)
    .execute({ usuarioId: 'u-9', isActive: false, actor });

  assertEquals(result.isFailure, true);
  assertEquals(eventos.length, 0);
});