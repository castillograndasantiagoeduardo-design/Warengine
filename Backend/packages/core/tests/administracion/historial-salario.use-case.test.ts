/**
 * historial-salario.use-case.test.ts
 *
 * Pruebas unitarias para los casos de uso de gestión del historial salarial (RF-ADM-C14).
 */

import { assertEquals, assertRejects } from 'jsr:@std/assert@^1';
import {
  ActorAuditoria,
  ConsultarHistorialSalariosUseCase,
  Empleado,
  EmpleadoInactivoError,
  EmpleadoNoEncontradoError,
  EventoAuditoria,
  HistorialSalario,
  IAuditor,
  IEmpleadoRepository,
  IHistorialSalarioRepository,
  RegistrarAumentoSalarioUseCase,
  RegistrarSalarioData,
} from '../../mod.ts';

const actor: ActorAuditoria = { usuarioId: 'admin-uuid', ip: '127.0.0.1' };

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

const empleadoActivo = new Empleado(
  'emp-1',
  'CC',
  '12345678',
  'Juan Pérez',
  '3001234567',
  'Calle 10',
  'Operario',
  1,
  'Bodega',
  1,
  'Sede Principal',
  '2026-01-01',
  1500000,
  true,
);

const empleadoInactivo = new Empleado(
  'emp-2',
  'CC',
  '87654321',
  'Carlos Inactivo',
  null,
  null,
  'Auxiliar',
  null,
  null,
  1,
  'Sede Principal',
  '2026-02-01',
  1200000,
  false,
);

function crearEmpleadoRepoFalso(lista: Empleado[] = [empleadoActivo, empleadoInactivo]): IEmpleadoRepository {
  return {
    listar: () => Promise.resolve(lista),
    findById: (id) => Promise.resolve(lista.find((e) => e.id === id) ?? null),
    actualizarDatos: () => Promise.reject(new Error('no implementado')),
  };
}

function crearHistorialSalarioRepoFalso(): IHistorialSalarioRepository & { items: HistorialSalario[] } {
  const items: HistorialSalario[] = [];
  return {
    items,
    listarPorEmpleado: (empId) =>
      Promise.resolve(items.filter((h) => h.empleadoId === empId)),
    obtenerUltimoSalario: (empId) =>
      Promise.resolve(items.filter((h) => h.empleadoId === empId).slice(-1)[0] ?? null),
    registrar: (data: RegistrarSalarioData) => {
      const registro = new HistorialSalario(
        `sal-${items.length + 1}`,
        data.empleadoId,
        data.sueldo,
        data.fechaEfectiva ?? '2026-10-13',
        data.motivo ?? null,
        data.registradoPor,
        new Date(),
      );
      items.push(registro);
      return Promise.resolve(registro);
    },
  };
}

Deno.test('RegistrarAumentoSalarioUseCase: registra aumento exitosamente y emite log de auditoría', async () => {
  const empRepo = crearEmpleadoRepoFalso();
  const histRepo = crearHistorialSalarioRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();

  const useCase = new RegistrarAumentoSalarioUseCase(empRepo, histRepo, auditor);

  const result = await useCase.execute({
    empleadoId: 'emp-1',
    sueldo: 1800000,
    motivo: 'Aumento por desempeño',
    fechaEfectiva: '2026-11-01',
    actor,
  });

  assertEquals(result.isSuccess, true);
  const data = result.value;
  assertEquals(data.sueldo, 1800000);
  assertEquals(data.motivo, 'Aumento por desempeño');
  assertEquals(data.fechaEfectiva, '2026-11-01');

  // Verifica que se guardó en el repositorio
  assertEquals(histRepo.items.length, 1);
  assertEquals(histRepo.items[0].sueldo, 1800000);

  // Verifica el evento de auditoría
  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'crear');
  assertEquals(eventos[0].entidad, 'historial_salarios');
  assertEquals((eventos[0].detalles as any).sueldoAnterior, 1500000);
  assertEquals((eventos[0].detalles as any).sueldoNuevo, 1800000);
});

Deno.test('RegistrarAumentoSalarioUseCase: falla con EmpleadoNoEncontradoError si el empleado no existe', async () => {
  const empRepo = crearEmpleadoRepoFalso();
  const histRepo = crearHistorialSalarioRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();

  const useCase = new RegistrarAumentoSalarioUseCase(empRepo, histRepo, auditor);

  const result = await useCase.execute({
    empleadoId: 'emp-fantasma',
    sueldo: 2000000,
    actor,
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error instanceof EmpleadoNoEncontradoError, true);
  assertEquals(eventos.length, 0);
  assertEquals(histRepo.items.length, 0);
});

Deno.test('RegistrarAumentoSalarioUseCase: falla con EmpleadoInactivoError si el empleado está desactivado', async () => {
  const empRepo = crearEmpleadoRepoFalso();
  const histRepo = crearHistorialSalarioRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();

  const useCase = new RegistrarAumentoSalarioUseCase(empRepo, histRepo, auditor);

  const result = await useCase.execute({
    empleadoId: 'emp-2',
    sueldo: 2000000,
    actor,
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error instanceof EmpleadoInactivoError, true);
  assertEquals(eventos.length, 0);
  assertEquals(histRepo.items.length, 0);
});

Deno.test('ConsultarHistorialSalariosUseCase: retorna la lista cronológica de ajustes salariales', async () => {
  const empRepo = crearEmpleadoRepoFalso();
  const histRepo = crearHistorialSalarioRepoFalso();
  await histRepo.registrar({
    empleadoId: 'emp-1',
    sueldo: 1500000,
    fechaEfectiva: '2026-01-01',
    motivo: 'Salario de ingreso',
    registradoPor: 'admin-uuid',
  });
  await histRepo.registrar({
    empleadoId: 'emp-1',
    sueldo: 1700000,
    fechaEfectiva: '2026-06-01',
    motivo: 'Ajuste anual',
    registradoPor: 'admin-uuid',
  });

  const useCase = new ConsultarHistorialSalariosUseCase(empRepo, histRepo);
  const result = await useCase.execute({ empleadoId: 'emp-1' });

  assertEquals(result.isSuccess, true);
  const lista = result.value;
  assertEquals(lista.length, 2);
  assertEquals(lista[0].sueldo, 1500000);
  assertEquals(lista[1].sueldo, 1700000);
});

Deno.test('ConsultarHistorialSalariosUseCase: falla con EmpleadoNoEncontradoError si el empleado no existe', async () => {
  const empRepo = crearEmpleadoRepoFalso();
  const histRepo = crearHistorialSalarioRepoFalso();

  const useCase = new ConsultarHistorialSalariosUseCase(empRepo, histRepo);
  const result = await useCase.execute({ empleadoId: 'emp-no-existe' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error instanceof EmpleadoNoEncontradoError, true);
});
