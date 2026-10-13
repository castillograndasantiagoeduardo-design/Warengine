/**
 * alerta-admin.use-case.test.ts
 *
 * Pruebas unitarias para los casos de uso de gestión de alertas administrativas (RF-ADM-C13).
 */

import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ActorAuditoria,
  AlertaAdmin,
  AlertaAdminNoEncontradaError,
  AtenderAlertaAdminUseCase,
  CrearAlertaAdminData,
  CrearAlertaAdminUseCase,
  EstadoAlerta,
  EventoAuditoria,
  FiltrosAlertasAdmin,
  IAlertaAdminRepository,
  IAuditor,
  ISucursalRepository,
  ListarAlertasAdminUseCase,
  ResolverAlcanceSucursalUseCase,
  Sucursal,
  SucursalFueraDeAlcanceError,
  SucursalInactivaError,
  SucursalNoEncontradaError,
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

const sucursalActiva = new Sucursal(1, 'Sede Norte', 'Calle 100', '3001234567', true);
const sucursalInactiva = new Sucursal(2, 'Sede Inactiva', 'Carrera 50', '3009876543', false);

function crearSucursalRepoFalso(): ISucursalRepository {
  const lista = [sucursalActiva, sucursalInactiva];
  return {
    listar: () => Promise.resolve(lista),
    findById: (id) => Promise.resolve(lista.find((s) => s.id === id) ?? null),
    findByNombre: (n) => Promise.resolve(lista.find((s) => s.nombre === n) ?? null),
    crear: () => Promise.reject(new Error('no implementado')),
    actualizar: () => Promise.reject(new Error('no implementado')),
  };
}

function crearAlertaRepoFalso(): IAlertaAdminRepository & { items: AlertaAdmin[] } {
  const items: AlertaAdmin[] = [];
  return {
    items,
    listar: (filtros?: FiltrosAlertasAdmin) => {
      let res = [...items];
      if (filtros?.sucursalIds) {
        res = res.filter((a) => filtros.sucursalIds!.includes(a.sucursalId));
      }
      if (filtros?.estado) {
        res = res.filter((a) => a.estado === filtros.estado);
      }
      if (filtros?.prioridad) {
        res = res.filter((a) => a.prioridad === filtros.prioridad);
      }
      return Promise.resolve(res);
    },
    findById: (id: string) => Promise.resolve(items.find((a) => a.id === id) ?? null),
    crear: (data: CrearAlertaAdminData) => {
      const alerta = new AlertaAdmin(
        `alt-${items.length + 1}`,
        data.usuarioId,
        data.sucursalId,
        data.motivo,
        data.prioridad ?? 'normal',
        data.descripcion ?? null,
        'pendiente',
        new Date(),
        null,
      );
      items.push(alerta);
      return Promise.resolve(alerta);
    },
    actualizarEstado: (id: string, estado: EstadoAlerta, fechaAtencion?: Date | null) => {
      const idx = items.findIndex((a) => a.id === id);
      const anterior = items[idx];
      const actualizada = new AlertaAdmin(
        anterior.id,
        anterior.usuarioId,
        anterior.sucursalId,
        anterior.motivo,
        anterior.prioridad,
        anterior.descripcion,
        estado,
        anterior.fechaCreacion,
        fechaAtencion ?? null,
      );
      items[idx] = actualizada;
      return Promise.resolve(actualizada);
    },
  };
}

function crearAlcanceResolverFalso(esGlobal: boolean, permitidas: number[] = [1]) {
  return {
    execute: () =>
      Promise.resolve({
        isSuccess: true,
        isFailure: false,
        value: {
          esGlobal,
          permite: (id: number) => esGlobal || permitidas.includes(id),
          sucursalesPermitidas: () => (esGlobal ? undefined : permitidas),
        },
      }),
  } as unknown as ResolverAlcanceSucursalUseCase;
}

Deno.test('CrearAlertaAdminUseCase: crea alerta exitosamente y audita la acción', async () => {
  const sucRepo = crearSucursalRepoFalso();
  const altRepo = crearAlertaRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();

  const useCase = new CrearAlertaAdminUseCase(sucRepo, altRepo, auditor);
  const result = await useCase.execute({
    sucursalId: 1,
    motivo: 'Fallo en terminal de cobro',
    prioridad: 'urgente',
    descripcion: 'No lee tarjetas chip',
    actor,
  });

  assertEquals(result.isSuccess, true);
  const alerta = result.value;
  assertEquals(alerta.motivo, 'Fallo en terminal de cobro');
  assertEquals(alerta.prioridad, 'urgente');
  assertEquals(alerta.estado, 'pendiente');
  assertEquals(altRepo.items.length, 1);

  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'crear');
  assertEquals(eventos[0].entidad, 'alertas_admin');
});

Deno.test('CrearAlertaAdminUseCase: rechaza sucursal inexistente', async () => {
  const sucRepo = crearSucursalRepoFalso();
  const altRepo = crearAlertaRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();

  const useCase = new CrearAlertaAdminUseCase(sucRepo, altRepo, auditor);
  const result = await useCase.execute({
    sucursalId: 999,
    motivo: 'Alerta inválida',
    actor,
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error instanceof SucursalNoEncontradaError, true);
  assertEquals(eventos.length, 0);
});

Deno.test('CrearAlertaAdminUseCase: rechaza sucursal inactiva', async () => {
  const sucRepo = crearSucursalRepoFalso();
  const altRepo = crearAlertaRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();

  const useCase = new CrearAlertaAdminUseCase(sucRepo, altRepo, auditor);
  const result = await useCase.execute({
    sucursalId: 2,
    motivo: 'Alerta sede inactiva',
    actor,
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error instanceof SucursalInactivaError, true);
  assertEquals(eventos.length, 0);
});

Deno.test('ListarAlertasAdminUseCase: filtra por alcance de sucursal', async () => {
  const altRepo = crearAlertaRepoFalso();
  await altRepo.crear({ usuarioId: 'u1', sucursalId: 1, motivo: 'Alerta sede 1' });
  await altRepo.crear({ usuarioId: 'u2', sucursalId: 2, motivo: 'Alerta sede 2' });

  // Usuario con alcance solo en sucursal 1
  const resolverLimitado = crearAlcanceResolverFalso(false, [1]);
  const useCase = new ListarAlertasAdminUseCase(resolverLimitado, altRepo);

  const res = await useCase.execute({ usuarioId: 'u-limitado' });
  assertEquals(res.isSuccess, true);
  assertEquals(res.value.length, 1);
  assertEquals(res.value[0].sucursalId, 1);
});

Deno.test('ListarAlertasAdminUseCase: falla si solicita sucursal fuera de su alcance', async () => {
  const altRepo = crearAlertaRepoFalso();
  const resolverLimitado = crearAlcanceResolverFalso(false, [1]);
  const useCase = new ListarAlertasAdminUseCase(resolverLimitado, altRepo);

  const res = await useCase.execute({ usuarioId: 'u-limitado', sucursalId: 2 });
  assertEquals(res.isFailure, true);
  assertEquals(res.error instanceof SucursalFueraDeAlcanceError, true);
});

Deno.test('AtenderAlertaAdminUseCase: cambia estado a atendido y fija fechaAtencion', async () => {
  const altRepo = crearAlertaRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();
  const creada = await altRepo.crear({ usuarioId: 'u1', sucursalId: 1, motivo: 'Alerta' });

  const useCase = new AtenderAlertaAdminUseCase(altRepo, auditor);
  const result = await useCase.execute({
    id: creada.id,
    estado: 'atendido',
    actor,
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.estado, 'atendido');
  assertEquals(result.value.fechaAtencion !== null, true);

  assertEquals(eventos.length, 1);
  assertEquals(eventos[0].accion, 'editar');
  assertEquals(eventos[0].entidad, 'alertas_admin');
});

Deno.test('AtenderAlertaAdminUseCase: falla si la alerta no existe', async () => {
  const altRepo = crearAlertaRepoFalso();
  const { auditor, eventos } = crearAuditorFalso();

  const useCase = new AtenderAlertaAdminUseCase(altRepo, auditor);
  const result = await useCase.execute({
    id: 'alt-inexistente',
    estado: 'visto',
    actor,
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error instanceof AlertaAdminNoEncontradaError, true);
  assertEquals(eventos.length, 0);
});
