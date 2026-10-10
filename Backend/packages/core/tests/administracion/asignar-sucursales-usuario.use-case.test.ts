/**
 * asignar-sucursales-usuario.use-case.test.ts — RF-ADM-C10: asignación de un usuario a una o
 * varias sucursales. Repositorios falsos en memoria (sin tocar MySQL).
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ActorAuditoria,
  AsignarSucursalesUsuarioUseCase,
  EventoAuditoria,
  IAuditor,
  IGestionUsuarioRepository,
  ISucursalRepository,
  IUsuarioSucursalRepository,
  ObtenerSucursalesUsuarioUseCase,
  Sucursal,
  UsuarioGestionado,
} from '../../mod.ts';

const actor: ActorAuditoria = { usuarioId: 'super-1', ip: '10.0.0.5' };

function auditorFalso() {
  const eventos: EventoAuditoria[] = [];
  const auditor: IAuditor = { registrar: (e) => { eventos.push(e); return Promise.resolve(); } };
  return { auditor, eventos };
}

// 1 Centro, 2 Norte, 3 Sur activas; 4 Cerrada inactiva
const SUCURSALES = [
  new Sucursal(1, 'Centro', null, null, true),
  new Sucursal(2, 'Norte', null, null, true),
  new Sucursal(3, 'Sur', null, null, true),
  new Sucursal(4, 'Cerrada', null, null, false),
];

const sucursalesFalsas: ISucursalRepository = {
  listar: () => Promise.resolve(SUCURSALES),
  findById: (id) => Promise.resolve(SUCURSALES.find((s) => s.id === id) ?? null),
  findByNombre: () => Promise.resolve(null),
  crear: () => Promise.reject(new Error('no se usa')),
  actualizar: () => Promise.reject(new Error('no se usa')),
};

function usuario(principal = 1, nombrePrincipal = 'Centro') {
  return new UsuarioGestionado('u-9', 'Luis', 'luis@warengine.local', 2, 'admin-sucursal', principal, nombrePrincipal, true);
}

function usuariosFalsos(existente: UsuarioGestionado | null): IGestionUsuarioRepository {
  return {
    listar: () => Promise.resolve([]),
    findById: () => Promise.resolve(existente),
    existeEmail: () => Promise.resolve(false),
    existeDocumento: () => Promise.resolve(false),
    rolExiste: () => Promise.resolve(true),
    contarSuperAdminsActivos: () => Promise.resolve(2),
    crear: () => Promise.reject(new Error('no se usa')),
    actualizarRol: () => Promise.resolve(),
    actualizarEstado: () => Promise.resolve(),
    actualizarPassword: () => Promise.resolve(),
  };
}

interface Llamada { usuarioId: string; principal: number; adicionales: number[]; invalidarEn: Date }

function asignacionesFalsas(actuales: number[] = []) {
  const llamadas: Llamada[] = [];
  const repo: IUsuarioSucursalRepository = {
    obtenerIdsAdicionales: () => Promise.resolve(actuales),
    reemplazarSucursales: (usuarioId, principal, adicionales, invalidarEn) => {
      llamadas.push({ usuarioId, principal, adicionales, invalidarEn });
      return Promise.resolve();
    },
  };
  return { repo, llamadas };
}

function asignar(u: UsuarioGestionado | null, actuales: number[], req: { principal: number; adicionales: number[] }) {
  const { repo, llamadas } = asignacionesFalsas(actuales);
  const { auditor, eventos } = auditorFalso();
  const useCase = new AsignarSucursalesUsuarioUseCase(usuariosFalsos(u), sucursalesFalsas, repo, auditor);
  const resultado = useCase.execute({
    usuarioId: 'u-9',
    sucursalPrincipalId: req.principal,
    sucursalesAdicionalesIds: req.adicionales,
    actor,
  });
  return { resultado, llamadas, eventos };
}

Deno.test('AsignarSucursales: guarda las adicionales sin repetidos, sin la principal y ordenadas', async () => {
  const { resultado, llamadas } = asignar(usuario(1), [], { principal: 1, adicionales: [3, 2, 3, 1] });
  const result = await resultado;

  assertEquals(result.isSuccess, true);
  assertEquals(llamadas.length, 1);
  assertEquals(llamadas[0].principal, 1);
  assertEquals(llamadas[0].adicionales, [2, 3]);
  assertEquals(result.value.sucursalesAdicionalesIds, [2, 3]);
});

Deno.test('AsignarSucursales: audita solo lo que cambió, con antes y después', async () => {
  const { resultado, eventos } = asignar(usuario(1), [2], { principal: 1, adicionales: [2, 3] });
  await resultado;

  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'editar');
  assertEquals(eventos[0].entidad, 'usuarios');
  assertEquals(eventos[0].entidadId, 'u-9');
  assertEquals(eventos[0].actor, actor);
  assertEquals(eventos[0].detalles, {
    antes: { sucursalesAdicionalesIds: [2] },
    despues: { sucursalesAdicionalesIds: [2, 3] },
  });
});

Deno.test('AsignarSucursales: cambiar la principal también se audita', async () => {
  const { resultado, llamadas, eventos } = asignar(usuario(1), [], { principal: 2, adicionales: [] });
  await resultado;

  assertEquals(llamadas[0].principal, 2);
  assertEquals(eventos[0].detalles, {
    antes: { sucursalPrincipalId: 1 },
    despues: { sucursalPrincipalId: 2 },
  });
});

Deno.test('AsignarSucursales: sin cambios no toca la BD (ni los tokens) ni audita', async () => {
  const { resultado, llamadas, eventos } = asignar(usuario(1), [2, 3], { principal: 1, adicionales: [3, 2] });
  const result = await resultado;

  assertEquals(result.isSuccess, true);
  assertEquals(llamadas.length, 0);
  assertEquals(eventos.length, 0);
});

Deno.test('AsignarSucursales: falla si el usuario no existe', async () => {
  const { resultado, llamadas, eventos } = asignar(null, [], { principal: 1, adicionales: [] });
  const result = await resultado;

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_NO_ENCONTRADO');
  assertEquals(llamadas.length, 0);
  assertEquals(eventos.length, 0);
});

Deno.test('AsignarSucursales: falla si una sucursal no existe y no cambia nada', async () => {
  const { resultado, llamadas, eventos } = asignar(usuario(1), [], { principal: 1, adicionales: [2, 99] });
  const result = await resultado;

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_NO_ENCONTRADA');
  assertEquals(llamadas.length, 0);
  assertEquals(eventos.length, 0);
});

Deno.test('AsignarSucursales: no permite asignar una sucursal inactiva nueva', async () => {
  const { resultado, llamadas } = asignar(usuario(1), [], { principal: 4, adicionales: [] });
  const result = await resultado;

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_INACTIVA');
  assertEquals(llamadas.length, 0);
});

Deno.test('AsignarSucursales: conservar una sucursal que ya tenía (aunque esté inactiva) no bloquea', async () => {
  // Ya tenía la 4 (hoy inactiva); solo agrega la 3.
  const { resultado, llamadas } = asignar(usuario(1), [4], { principal: 1, adicionales: [3, 4] });
  const result = await resultado;

  assertEquals(result.isSuccess, true);
  assertEquals(llamadas[0].adicionales, [3, 4]);
});

Deno.test('ObtenerSucursales: devuelve principal, adicionales y autorizadas con nombres', async () => {
  const { repo } = asignacionesFalsas([2, 3]);
  const result = await new ObtenerSucursalesUsuarioUseCase(usuariosFalsos(usuario(1, 'Centro')), sucursalesFalsas, repo)
    .execute({ usuarioId: 'u-9' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.principal, { id: 1, nombre: 'Centro' });
  assertEquals(result.value.adicionales, [{ id: 2, nombre: 'Norte' }, { id: 3, nombre: 'Sur' }]);
  assertEquals(result.value.autorizadas.map((s) => s.id), [1, 2, 3]);
});

Deno.test('ObtenerSucursales: sin adicionales, las autorizadas son solo la principal', async () => {
  const { repo } = asignacionesFalsas([]);
  const result = await new ObtenerSucursalesUsuarioUseCase(usuariosFalsos(usuario(1, 'Centro')), sucursalesFalsas, repo)
    .execute({ usuarioId: 'u-9' });

  assertEquals(result.value.adicionales, []);
  assertEquals(result.value.autorizadas, [{ id: 1, nombre: 'Centro' }]);
});

Deno.test('ObtenerSucursales: falla si el usuario no existe', async () => {
  const { repo } = asignacionesFalsas();
  const result = await new ObtenerSucursalesUsuarioUseCase(usuariosFalsos(null), sucursalesFalsas, repo)
    .execute({ usuarioId: 'nadie' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'USUARIO_NO_ENCONTRADO');
});