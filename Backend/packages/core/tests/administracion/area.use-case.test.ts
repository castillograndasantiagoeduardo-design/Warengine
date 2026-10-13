/**
 * area.use-case.test.ts
 *
 * Pruebas unitarias para los casos de uso de gestión de áreas funcionales por sucursal.
 *
 * Rol en la arquitectura:
 * - Capa de Tests Unitarios (Core).
 * - Utiliza repositorios y auditor falso en memoria sin dependencias externas ni bases de datos.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Gestión de áreas por sucursal.
 * - RNF-ADM-02: Auditoría de mutaciones operativas.
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ActorAuditoria,
  Area,
  AreaDuplicadaError,
  AreaNoEncontradaError,
  AreaTieneEmpleadosError,
  CrearAreaUseCase,
  EditarAreaUseCase,
  EliminarAreaUseCase,
  EventoAuditoria,
  IAreaRepository,
  IAuditor,
  ISucursalRepository,
  ListarAreasPorSucursalUseCase,
  Sucursal,
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../mod.ts';

const actor: ActorAuditoria = { usuarioId: 'admin-uuid', ip: '192.168.1.100' };

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

const sucursalesIniciales = [
  new Sucursal(1, 'Sede Principal', 'Calle 100', '3001234567', true),
  new Sucursal(2, 'Sede Inactiva', 'Carrera 50', '3009876543', false),
];

function crearSucursalRepoFalso(lista = sucursalesIniciales): ISucursalRepository {
  return {
    listar: () => Promise.resolve(lista),
    findById: (id) => Promise.resolve(lista.find((s) => s.id === id) ?? null),
    findByNombre: (n) => Promise.resolve(lista.find((s) => s.nombre.toLowerCase() === n.toLowerCase()) ?? null),
    crear: () => Promise.reject(new Error('no implementado')),
    actualizar: () => Promise.reject(new Error('no implementado')),
  };
}

function crearAreaRepoFalso(
  areasIniciales: Area[] = [],
  empleadosPorArea: Record<number, number> = {},
): IAreaRepository & { areas: Area[] } {
  let contadorId = areasIniciales.length + 1;
  const areas = [...areasIniciales];

  return {
    areas,
    listarPorSucursal: (sucursalId) =>
      Promise.resolve(areas.filter((a) => a.sucursalId === sucursalId)),
    findById: (id) =>
      Promise.resolve(areas.find((a) => a.id === id) ?? null),
    findByNombreYSucursal: (nombre, sucursalId) =>
      Promise.resolve(
        areas.find(
          (a) => a.sucursalId === sucursalId && a.nombre.toLowerCase() === nombre.toLowerCase(),
        ) ?? null,
      ),
    crear: (data) => {
      const nueva = new Area(contadorId++, data.nombre, data.sucursalId);
      areas.push(nueva);
      return Promise.resolve(nueva);
    },
    actualizar: (id, data) => {
      const idx = areas.findIndex((a) => a.id === id);
      const actualizada = new Area(id, data.nombre, areas[idx].sucursalId);
      areas[idx] = actualizada;
      return Promise.resolve(actualizada);
    },
    eliminar: (id) => {
      const idx = areas.findIndex((a) => a.id === id);
      if (idx !== -1) areas.splice(idx, 1);
      return Promise.resolve();
    },
    contarEmpleadosEnArea: (id) => Promise.resolve(empleadosPorArea[id] ?? 0),
  };
}

Deno.test('ListarAreasPorSucursalUseCase - falla si la sucursal no existe', async () => {
  const sucursalRepo = crearSucursalRepoFalso();
  const areaRepo = crearAreaRepoFalso();
  const useCase = new ListarAreasPorSucursalUseCase(areaRepo, sucursalRepo);

  const res = await useCase.execute({ sucursalId: 999 });
  assertEquals(res.isFailure, true);
  assertEquals(res.error instanceof SucursalNoEncontradaError, true);
});

Deno.test('ListarAreasPorSucursalUseCase - lista áreas de la sucursal', async () => {
  const sucursalRepo = crearSucursalRepoFalso();
  const areaRepo = crearAreaRepoFalso([
    new Area(1, 'Bodega', 1),
    new Area(2, 'Ventas', 1),
    new Area(3, 'Caja', 2),
  ]);
  const useCase = new ListarAreasPorSucursalUseCase(areaRepo, sucursalRepo);

  const res = await useCase.execute({ sucursalId: 1 });
  assertEquals(res.isSuccess, true);
  assertEquals(res.value.length, 2);
  assertEquals(res.value[0].nombre, 'Bodega');
  assertEquals(res.value[1].nombre, 'Ventas');
});

Deno.test('CrearAreaUseCase - valida sucursal existente y activa', async () => {
  const sucursalRepo = crearSucursalRepoFalso();
  const areaRepo = crearAreaRepoFalso();
  const { auditor } = crearAuditorFalso();
  const useCase = new CrearAreaUseCase(areaRepo, sucursalRepo, auditor);

  // Sucursal inexistente
  const resInexistente = await useCase.execute({ sucursalId: 99, nombre: 'Bodega', actor });
  assertEquals(resInexistente.isFailure, true);
  assertEquals(resInexistente.error instanceof SucursalNoEncontradaError, true);

  // Sucursal inactiva
  const resInactiva = await useCase.execute({ sucursalId: 2, nombre: 'Bodega', actor });
  assertEquals(resInactiva.isFailure, true);
  assertEquals(resInactiva.error instanceof SucursalInactivaError, true);
});

Deno.test('CrearAreaUseCase - rechaza nombre duplicado en la misma sucursal y emite auditoría al crear', async () => {
  const sucursalRepo = crearSucursalRepoFalso();
  const areaRepo = crearAreaRepoFalso([new Area(1, 'Bodega', 1)]);
  const { auditor, eventos } = crearAuditorFalso();
  const useCase = new CrearAreaUseCase(areaRepo, sucursalRepo, auditor);

  // Nombre duplicado case-insensitive
  const resDup = await useCase.execute({ sucursalId: 1, nombre: 'bodega ', actor });
  assertEquals(resDup.isFailure, true);
  assertEquals(resDup.error instanceof AreaDuplicadaError, true);

  // Creación exitosa
  const resOk = await useCase.execute({ sucursalId: 1, nombre: 'Despacho', actor });
  assertEquals(resOk.isSuccess, true);
  assertEquals(resOk.value.nombre, 'Despacho');
  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'crear');
  assertEquals(eventos[0].entidad, 'areas');
});

Deno.test('EditarAreaUseCase - edita nombre y valida unicidad', async () => {
  const areaRepo = crearAreaRepoFalso([
    new Area(1, 'Bodega Principal', 1),
    new Area(2, 'Ventas', 1),
  ]);
  const { auditor, eventos } = crearAuditorFalso();
  const useCase = new EditarAreaUseCase(areaRepo, auditor);

  // No encontrada
  const resNoExiste = await useCase.execute({ id: 99, nombre: 'Otra', actor });
  assertEquals(resNoExiste.isFailure, true);
  assertEquals(resNoExiste.error instanceof AreaNoEncontradaError, true);

  // Nombre duplicado con otra área
  const resDup = await useCase.execute({ id: 2, nombre: 'Bodega Principal', actor });
  assertEquals(resDup.isFailure, true);
  assertEquals(resDup.error instanceof AreaDuplicadaError, true);

  // Mismo nombre (sin cambios) no emite log
  const resMismo = await useCase.execute({ id: 1, nombre: 'bodega principal', actor });
  assertEquals(resMismo.isSuccess, true);
  assertEquals(eventos.length, 0);

  // Edición exitosa
  const resOk = await useCase.execute({ id: 1, nombre: 'Almacén Central', actor });
  assertEquals(resOk.isSuccess, true);
  assertEquals(resOk.value.nombre, 'Almacén Central');
  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'editar');
});

Deno.test('EliminarAreaUseCase - impide eliminar área con empleados y audita eliminación exitosa', async () => {
  const areaRepo = crearAreaRepoFalso(
    [new Area(1, 'Bodega Con Personal', 1), new Area(2, 'Bodega Vacía', 1)],
    { 1: 3 }, // Área 1 tiene 3 empleados
  );
  const { auditor, eventos } = crearAuditorFalso();
  const useCase = new EliminarAreaUseCase(areaRepo, auditor);

  // Intento de borrar área con empleados asignados
  const resConEmpleados = await useCase.execute({ id: 1, actor });
  assertEquals(resConEmpleados.isFailure, true);
  assertEquals(resConEmpleados.error instanceof AreaTieneEmpleadosError, true);

  // Borrado de área vacía
  const resOk = await useCase.execute({ id: 2, actor });
  assertEquals(resOk.isSuccess, true);
  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'eliminar');
  assertEquals(eventos[0].entidad, 'areas');
  assertEquals(areaRepo.areas.length, 1);
});
