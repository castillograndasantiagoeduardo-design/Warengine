/**
 * empleado.use-case.test.ts
 *
 * Pruebas unitarias para los casos de uso de consulta y edición independiente de empleados.
 *
 * Rol en la arquitectura:
 * - Capa de Tests Unitarios (Core).
 * - Aísla la lógica de negocio con dobles de prueba en memoria.
 *
 * Requisito SRS:
 * - RF-ADM-C12: Edición independiente de datos de empleados.
 * - RF-ADM-C5: Consulta de personal con filtros.
 * - RNF-ADM-02: Auditoría diferencial de mutaciones laborales.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import { Result } from '@warengine/shared-kernel';
import {
  ActorAuditoria,
  AlcanceSucursal,
  Area,
  AreaNoEncontradaError,
  AreaNoPerteneceASucursalError,
  EditarEmpleadoUseCase,
  Empleado,
  EmpleadoNoEncontradoError,
  EventoAuditoria,
  IAreaRepository,
  IAuditor,
  IEmpleadoRepository,
  ListarEmpleadosUseCase,
  ObtenerEmpleadoPorIdUseCase,
  ResolverAlcanceSucursalUseCase,
} from '../../mod.ts';

const actor: ActorAuditoria = { usuarioId: 'admin-1', ip: '192.168.1.1' };

/** Resolver de alcance falso: global (Super Admin) o limitado a ciertas sedes. */
function alcance(sedes?: number[]): ResolverAlcanceSucursalUseCase {
  const valor = sedes ? AlcanceSucursal.limitado(sedes) : AlcanceSucursal.global();
  return { execute: () => Promise.resolve(Result.ok(valor)) } as unknown as ResolverAlcanceSucursalUseCase;
}

function crearAuditorFalso() {
  const eventos: EventoAuditoria[] = [];
  const auditor: IAuditor = {
    registrar: (e) => {
      eventos.push(e);
      return Promise.resolve();
    },
  };
  return { auditor, eventos };
}

function crearAreaRepoFalso(): IAreaRepository {
  const areas = [
    new Area(1, 'Bodega Central', 1),
    new Area(2, 'Ventas Central', 1),
    new Area(3, 'Bodega Norte', 2), // Sucursal 2
  ];
  return {
    listarPorSucursal: (sId) => Promise.resolve(areas.filter((a) => a.sucursalId === sId)),
    findById: (id) => Promise.resolve(areas.find((a) => a.id === id) ?? null),
    findByNombreYSucursal: () => Promise.resolve(null),
    crear: () => Promise.reject(new Error('no implementado')),
    actualizar: () => Promise.reject(new Error('no implementado')),
    eliminar: () => Promise.reject(new Error('no implementado')),
    contarEmpleadosEnArea: () => Promise.resolve(0),
  };
}

function crearEmpleadoEjemplo(
  id = 'emp-1',
  sucursalId = 1,
  areaId: number | null = 1,
): Empleado {
  return new Empleado(
    id,
    'CC',
    '1010101010',
    'Carlos Rodriguez',
    '3101234567',
    'Calle 10 # 20-30',
    'Auxiliar de Bodega',
    areaId,
    areaId ? 'Bodega Central' : null,
    sucursalId,
    'Sede Central',
    '2026-01-15',
    1500000,
    true,
  );
}

function crearEmpleadoRepoFalso(empleadosIniciales: Empleado[] = [crearEmpleadoEjemplo()]): IEmpleadoRepository {
  const lista = [...empleadosIniciales];

  return {
    listar: (filtros) => {
      let res = [...lista];
      if (filtros?.sucursalId !== undefined) {
        res = res.filter((e) => e.sucursalId === filtros.sucursalId);
      }
      if (filtros?.sucursalIds !== undefined) {
        res = res.filter((e) => filtros.sucursalIds!.includes(e.sucursalId));
      }
      if (filtros?.areaId !== undefined) {
        res = res.filter((e) => e.areaId === filtros.areaId);
      }
      if (filtros?.isActive !== undefined) {
        res = res.filter((e) => e.isActive === filtros.isActive);
      }
      return Promise.resolve(res);
    },
    findById: (id) => Promise.resolve(lista.find((e) => e.id === id) ?? null),
    actualizarDatos: (id, data) => {
      const idx = lista.findIndex((e) => e.id === id);
      const actual = lista[idx];
      const actualizado = new Empleado(
        actual.id,
        actual.tipoDocumento,
        actual.numeroDocumento,
        data.nombre ?? actual.nombre,
        data.telefono !== undefined ? data.telefono : actual.telefono,
        data.direccion !== undefined ? data.direccion : actual.direccion,
        data.cargo !== undefined ? data.cargo : actual.cargo,
        data.areaId !== undefined ? data.areaId : actual.areaId,
        data.areaId ? 'Área Actualizada' : null,
        actual.sucursalId,
        actual.sucursalNombre,
        actual.fechaIngreso,
        actual.sueldoActual,
        data.isActive !== undefined ? data.isActive : actual.isActive,
      );
      lista[idx] = actualizado;
      return Promise.resolve(actualizado);
    },
  };
}

Deno.test('ListarEmpleadosUseCase - lista con y sin filtros', async () => {
  const repo = crearEmpleadoRepoFalso([
    crearEmpleadoEjemplo('emp-1', 1, 1),
    crearEmpleadoEjemplo('emp-2', 2, 3),
  ]);
  const useCase = new ListarEmpleadosUseCase(repo, alcance());

  const resTodos = await useCase.execute({ usuarioId: 'sa' });
  assertEquals(resTodos.isSuccess, true);
  assertEquals(resTodos.value.length, 2);

  const resSucursal = await useCase.execute({ sucursalId: 1, usuarioId: 'sa' });
  assertEquals(resSucursal.isSuccess, true);
  assertEquals(resSucursal.value.length, 1);
  assertEquals(resSucursal.value[0].id, 'emp-1');
});

Deno.test('ObtenerEmpleadoPorIdUseCase - consulta por ID y valida inexistente', async () => {
  const repo = crearEmpleadoRepoFalso();
  const useCase = new ObtenerEmpleadoPorIdUseCase(repo, alcance());

  const resOk = await useCase.execute({ id: 'emp-1', usuarioId: 'sa' });
  assertEquals(resOk.isSuccess, true);
  assertEquals(resOk.value.nombre, 'Carlos Rodriguez');

  const resNoExiste = await useCase.execute({ id: 'inexistente', usuarioId: 'sa' });
  assertEquals(resNoExiste.isFailure, true);
  assertEquals(resNoExiste.error instanceof EmpleadoNoEncontradoError, true);
});

Deno.test('EditarEmpleadoUseCase - rechaza si el empleado no existe', async () => {
  const empleadoRepo = crearEmpleadoRepoFalso();
  const areaRepo = crearAreaRepoFalso();
  const { auditor } = crearAuditorFalso();
  const useCase = new EditarEmpleadoUseCase(empleadoRepo, areaRepo, auditor, alcance());

  const res = await useCase.execute({ id: 'no-existe', cargo: 'Jefe', actor });
  assertEquals(res.isFailure, true);
  assertEquals(res.error instanceof EmpleadoNoEncontradoError, true);
});

Deno.test('EditarEmpleadoUseCase - rechaza si el área no existe o es de otra sucursal', async () => {
  const empleadoRepo = crearEmpleadoRepoFalso(); // empleado está en sucursal 1
  const areaRepo = crearAreaRepoFalso();
  const { auditor } = crearAuditorFalso();
  const useCase = new EditarEmpleadoUseCase(empleadoRepo, areaRepo, auditor, alcance());

  // Área inexistente
  const resAreaNoExiste = await useCase.execute({ id: 'emp-1', areaId: 999, actor });
  assertEquals(resAreaNoExiste.isFailure, true);
  assertEquals(resAreaNoExiste.error instanceof AreaNoEncontradaError, true);

  // Área 3 pertenece a la sucursal 2, mientras el empleado pertenece a la 1
  const resAreaOtraSucursal = await useCase.execute({ id: 'emp-1', areaId: 3, actor });
  assertEquals(resAreaOtraSucursal.isFailure, true);
  assertEquals(resAreaOtraSucursal.error instanceof AreaNoPerteneceASucursalError, true);
});

Deno.test('EditarEmpleadoUseCase - edita datos válidos y emite auditoría diferencial', async () => {
  const empleadoRepo = crearEmpleadoRepoFalso();
  const areaRepo = crearAreaRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();
  const useCase = new EditarEmpleadoUseCase(empleadoRepo, areaRepo, auditor, alcance());

  const res = await useCase.execute({
    id: 'emp-1',
    cargo: 'Coordinador de Almacén',
    telefono: '3119998877',
    areaId: 2, // Área 2 pertenece a la sucursal 1
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.cargo, 'Coordinador de Almacén');
  assertEquals(res.value.telefono, '3119998877');
  assertEquals(res.value.areaId, 2);

  // Verifica que se haya registrado exactamente un evento de auditoría
  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'editar');
  assertEquals(eventos[0].entidad, 'empleados');
  assertEquals(eventos[0].entidadId, 'emp-1');
  const detalles = eventos[0].detalles as { antes: Record<string, unknown>; despues: Record<string, unknown> };
  assertEquals(detalles.antes.cargo, 'Auxiliar de Bodega');
  assertEquals(detalles.despues.cargo, 'Coordinador de Almacén');
  assertEquals(detalles.antes.telefono, '3101234567');
  assertEquals(detalles.despues.telefono, '3119998877');
  assertEquals(detalles.antes.areaId, 1);
  assertEquals(detalles.despues.areaId, 2);
});

Deno.test('RNF-ADM-04: un admin de sucursal solo lista empleados de sus sedes', async () => {
  const repo = crearEmpleadoRepoFalso([crearEmpleadoEjemplo('emp-1', 1, 1), crearEmpleadoEjemplo('emp-2', 2, 3)]);
  const useCase = new ListarEmpleadosUseCase(repo, alcance([2]));

  const res = await useCase.execute({ usuarioId: 'admin-norte' });
  assertEquals(res.value.map((e) => e.id), ['emp-2']);

  const fuera = await useCase.execute({ usuarioId: 'admin-norte', sucursalId: 1 });
  assertEquals(fuera.isFailure, true);
  assertEquals(fuera.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});

Deno.test('RNF-ADM-04: sin sedes asignadas la lista es vacía', async () => {
  const useCase = new ListarEmpleadosUseCase(crearEmpleadoRepoFalso(), alcance([]));
  const res = await useCase.execute({ usuarioId: 'sin-sede' });
  assertEquals(res.value, []);
});

Deno.test('RNF-ADM-04: no se puede ver ni editar un empleado de otra sede', async () => {
  const { auditor, eventos } = crearAuditorFalso();
  const obtener = new ObtenerEmpleadoPorIdUseCase(crearEmpleadoRepoFalso(), alcance([2]));
  const editar = new EditarEmpleadoUseCase(crearEmpleadoRepoFalso(), crearAreaRepoFalso(), auditor, alcance([2]));

  const ver = await obtener.execute({ id: 'emp-1', usuarioId: 'admin-norte' });
  assertEquals(ver.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');

  const cambio = await editar.execute({ id: 'emp-1', cargo: 'Intruso', actor: { usuarioId: 'admin-norte', ip: null } });
  assertEquals(cambio.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
  assertEquals(eventos.length, 0);
});
