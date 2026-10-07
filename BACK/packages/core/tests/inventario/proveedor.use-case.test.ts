import { assertEquals } from 'jsr:@std/assert@^1';
import {
  Proveedor,
  IProveedorRepository,
  DatosCrearProveedor,
  DatosActualizarProveedor,
  FiltrosListarProveedores,
  ResultadoPaginado,
  CrearProveedorUseCase,
  EditarProveedorUseCase,
  InactivarProveedorUseCase,
  ReactivarProveedorUseCase,
  CambiarEstadoProveedorUseCase,
  ListarProveedoresUseCase,
  ObtenerProveedorPorIdUseCase,
  IAuditor,
  EventoAuditoria,
  ActorAuditoria,
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
} from '../../mod.ts';

// ─── Fake Repository ─────────────────────────────────────────────────────────

class FakeProveedorRepository implements IProveedorRepository {
  public proveedores: Proveedor[] = [];
  private nextId = 1;

  public listar(params: FiltrosListarProveedores): Promise<ResultadoPaginado<Proveedor>> {
    let filtrados = [...this.proveedores];

    if (params.busqueda) {
      const q = params.busqueda.toLowerCase();
      filtrados = filtrados.filter((p) => p.nombre.toLowerCase().includes(q));
    }

    if (params.isActive !== undefined) {
      filtrados = filtrados.filter((p) => p.isActive === params.isActive);
    }

    const total = filtrados.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const items = filtrados.slice(offset, offset + limit);

    return Promise.resolve({ items, total, page, limit, totalPages });
  }

  public listarActivos(): Promise<Proveedor[]> {
    return Promise.resolve(this.proveedores.filter((p) => p.isActive));
  }

  public findById(id: number): Promise<Proveedor | null> {
    const encontrado = this.proveedores.find((p) => p.id === id) ?? null;
    return Promise.resolve(encontrado);
  }

  public crear(datos: DatosCrearProveedor): Promise<Proveedor> {
    const nuevo = new Proveedor(this.nextId++, datos.nombre, datos.contacto ?? null, true);
    this.proveedores.push(nuevo);
    return Promise.resolve(nuevo);
  }

  public actualizar(id: number, cambios: DatosActualizarProveedor): Promise<Proveedor> {
    const idx = this.proveedores.findIndex((p) => p.id === id);
    const actual = this.proveedores[idx];
    const actualizado = new Proveedor(
      actual.id,
      cambios.nombre ?? actual.nombre,
      cambios.contacto !== undefined ? cambios.contacto : actual.contacto,
      cambios.isActive ?? actual.isActive,
    );
    this.proveedores[idx] = actualizado;
    return Promise.resolve(actualizado);
  }

  public cambiarEstado(id: number, isActive: boolean): Promise<Proveedor> {
    return this.actualizar(id, { isActive });
  }
}

class FakeAuditor implements IAuditor {
  public eventos: EventoAuditoria[] = [];

  public registrar(evento: EventoAuditoria): Promise<void> {
    this.eventos.push(evento);
    return Promise.resolve();
  }
}

const actor: ActorAuditoria = { usuarioId: 'usr-admin-1', ip: '10.0.0.1' };

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('Proveedor Entity: métodos activar e inactivar', () => {
  const prov = new Proveedor(1, 'Distribuidora SAS', 'contacto@dist.com', true);
  const inactivo = prov.inactivar();
  assertEquals(inactivo.isActive, false);
  assertEquals(inactivo.nombre, 'Distribuidora SAS');
  assertEquals(inactivo.contacto, 'contacto@dist.com');

  const activo = inactivo.activar();
  assertEquals(activo.isActive, true);
});

Deno.test('CrearProveedorUseCase: crea un proveedor y audita con despues', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new CrearProveedorUseCase(repo, audit);

  const res = await useCase.execute({
    nombre: 'Colanta',
    contacto: 'ventas@colanta.com.co',
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Colanta');
  assertEquals(res.value.contacto, 'ventas@colanta.com.co');
  assertEquals(res.value.isActive, true);
  assertEquals(repo.proveedores.length, 1);

  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.CREAR);
  assertEquals(audit.eventos[0].entidad, ENTIDADES_AUDITORIA.PROVEEDORES);
  assertEquals(audit.eventos[0].entidadId, '1');
  assertEquals(audit.eventos[0].actor, actor);
  assertEquals(audit.eventos[0].detalles, {
    despues: {
      nombre: 'Colanta',
      contacto: 'ventas@colanta.com.co',
      isActive: true,
    },
  });
});

Deno.test('ObtenerProveedorPorIdUseCase: retorna proveedor existente', async () => {
  const repo = new FakeProveedorRepository();
  await repo.crear({ nombre: 'Bimbo', contacto: '+57 300 0000000' });
  const useCase = new ObtenerProveedorPorIdUseCase(repo);

  const res = await useCase.execute({ id: 1 });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Bimbo');
  assertEquals(res.value.contacto, '+57 300 0000000');
});

Deno.test('ObtenerProveedorPorIdUseCase: falla con PROVEEDOR_NO_ENCONTRADO si no existe', async () => {
  const repo = new FakeProveedorRepository();
  const useCase = new ObtenerProveedorPorIdUseCase(repo);

  const res = await useCase.execute({ id: 999 });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_NO_ENCONTRADO');
});

Deno.test('EditarProveedorUseCase: edita nombre y contacto y audita con antes/despues', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  await repo.crear({ nombre: 'Postobón', contacto: 'antiguo@postobon.com' });

  const useCase = new EditarProveedorUseCase(repo, audit);
  const res = await useCase.execute({
    id: 1,
    nombre: 'Postobón S.A.',
    contacto: 'nuevo@postobon.com',
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Postobón S.A.');
  assertEquals(res.value.contacto, 'nuevo@postobon.com');
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.EDITAR);
  assertEquals(audit.eventos[0].entidad, ENTIDADES_AUDITORIA.PROVEEDORES);
  assertEquals(audit.eventos[0].entidadId, '1');
  assertEquals(audit.eventos[0].actor, actor);
  assertEquals(audit.eventos[0].detalles, {
    antes: { nombre: 'Postobón', contacto: 'antiguo@postobon.com' },
    despues: { nombre: 'Postobón S.A.', contacto: 'nuevo@postobon.com' },
  });
});

Deno.test('EditarProveedorUseCase: falla si el id no existe y NO audita', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new EditarProveedorUseCase(repo, audit);

  const res = await useCase.execute({ id: 99, nombre: 'No existe', actor });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_NO_ENCONTRADO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('InactivarProveedorUseCase: cambia isActive a false y audita antes/despues', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  await repo.crear({ nombre: 'Nestlé' });

  const useCase = new InactivarProveedorUseCase(repo, audit);
  const res = await useCase.execute({ id: 1, actor });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.isActive, false);
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.INACTIVAR);
  assertEquals(audit.eventos[0].entidad, ENTIDADES_AUDITORIA.PROVEEDORES);
  assertEquals(audit.eventos[0].entidadId, '1');
  assertEquals(audit.eventos[0].actor, actor);
  assertEquals(audit.eventos[0].detalles, {
    antes: { isActive: true },
    despues: { isActive: false },
  });
});

Deno.test('InactivarProveedorUseCase: falla si el proveedor no existe y NO audita', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new InactivarProveedorUseCase(repo, audit);

  const res = await useCase.execute({ id: 404, actor });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_NO_ENCONTRADO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('ReactivarProveedorUseCase: cambia isActive a true y audita con activar', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const prov = await repo.crear({ nombre: 'Alquería' });
  await repo.cambiarEstado(prov.id, false);

  const useCase = new ReactivarProveedorUseCase(repo, audit);
  const res = await useCase.execute({ id: prov.id, actor });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.isActive, true);
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.ACTIVAR);
  assertEquals(audit.eventos[0].entidad, ENTIDADES_AUDITORIA.PROVEEDORES);
  assertEquals(audit.eventos[0].entidadId, String(prov.id));
  assertEquals(audit.eventos[0].actor, actor);
  assertEquals(audit.eventos[0].detalles, {
    antes: { isActive: false },
    despues: { isActive: true },
  });
});

Deno.test('ReactivarProveedorUseCase: falla si el proveedor no existe y NO audita', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new ReactivarProveedorUseCase(repo, audit);

  const res = await useCase.execute({ id: 404, actor });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_NO_ENCONTRADO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('CambiarEstadoProveedorUseCase: delega correctamente según isActive', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const inactivar = new InactivarProveedorUseCase(repo, audit);
  const reactivar = new ReactivarProveedorUseCase(repo, audit);
  const useCase = new CambiarEstadoProveedorUseCase(inactivar, reactivar);

  await repo.crear({ nombre: 'Bavaria' });

  // Inactivar
  const resInact = await useCase.execute({ id: 1, isActive: false, actor });
  assertEquals(resInact.isSuccess, true);
  assertEquals(resInact.value.isActive, false);

  // Reactivar
  const resAct = await useCase.execute({ id: 1, isActive: true, actor });
  assertEquals(resAct.isSuccess, true);
  assertEquals(resAct.value.isActive, true);

  assertEquals(audit.eventos.length, 2);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.INACTIVAR);
  assertEquals(audit.eventos[1].accion, ACCIONES_AUDITORIA.ACTIVAR);
});

Deno.test('ListarProveedoresUseCase: paginación y filtros de búsqueda', async () => {
  const repo = new FakeProveedorRepository();
  await repo.crear({ nombre: 'Distribuidora Norte' });
  await repo.crear({ nombre: 'Distribuidora Sur' });
  const p3 = await repo.crear({ nombre: 'Comercializadora Andina' });
  await repo.cambiarEstado(p3.id, false); // inactivo

  const useCase = new ListarProveedoresUseCase(repo);

  // 1. Sin filtros
  const resTodos = await useCase.execute({ page: 1, limit: 10 });
  assertEquals(resTodos.isSuccess, true);
  assertEquals(resTodos.value.total, 3);
  assertEquals(resTodos.value.items.length, 3);

  // 2. Búsqueda por texto "distribuidora"
  const resBusqueda = await useCase.execute({ busqueda: 'distribuidora', page: 1, limit: 10 });
  assertEquals(resBusqueda.isSuccess, true);
  assertEquals(resBusqueda.value.total, 2);

  // 3. Filtro solo activos
  const resActivos = await useCase.execute({ isActive: true, page: 1, limit: 10 });
  assertEquals(resActivos.isSuccess, true);
  assertEquals(resActivos.value.total, 2);

  // 4. Filtro solo inactivos
  const resInactivos = await useCase.execute({ isActive: false, page: 1, limit: 10 });
  assertEquals(resInactivos.isSuccess, true);
  assertEquals(resInactivos.value.total, 1);
  assertEquals(resInactivos.value.items[0].nombre, 'Comercializadora Andina');

  // 5. Paginación limit 1
  const resPaginado = await useCase.execute({ page: 2, limit: 1 });
  assertEquals(resPaginado.isSuccess, true);
  assertEquals(resPaginado.value.page, 2);
  assertEquals(resPaginado.value.totalPages, 3);
  assertEquals(resPaginado.value.items.length, 1);

  // 6. Puerto listarActivos
  const activos = await repo.listarActivos();
  assertEquals(activos.length, 2);
});
