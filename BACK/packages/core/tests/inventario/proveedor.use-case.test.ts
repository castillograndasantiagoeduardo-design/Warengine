import { assertEquals } from 'jsr:@std/assert@^1';
import {
  CambiarEstadoProveedorUseCase,
  CrearProveedorUseCase,
  DatosActualizarProveedor,
  DatosCrearProveedor,
  EditarProveedorUseCase,
  EventoAuditoria,
  FiltrosListarProveedores,
  IAuditoriaService,
  IProveedorRepository,
  InactivarProveedorUseCase,
  ListarProveedoresUseCase,
  ObtenerProveedorPorIdUseCase,
  Proveedor,
  ProveedorNoEncontradoError,
  ReactivarProveedorUseCase,
  ResultadoPaginado,
} from '../../mod.ts';

// ─── Fake In-Memory Repository & Audit ──────────────────────────────────────

class FakeProveedorRepository implements IProveedorRepository {
  public proveedores: Proveedor[] = [];
  private nextId = 1;

  public listar(filtros: FiltrosListarProveedores): Promise<ResultadoPaginado<Proveedor>> {
    let filtrados = [...this.proveedores];

    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      filtrados = filtrados.filter((p) => p.nombre.toLowerCase().includes(q));
    }

    if (filtros.isActive !== undefined) {
      filtrados = filtrados.filter((p) => p.isActive === filtros.isActive);
    }

    const total = filtrados.length;
    const page = Math.max(1, filtros.page);
    const limit = Math.max(1, filtros.limit);
    const offset = (page - 1) * limit;
    const items = filtrados.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  }

  public listarActivos(): Promise<Proveedor[]> {
    return Promise.resolve(this.proveedores.filter((p) => p.isActive));
  }

  public findById(id: number): Promise<Proveedor | null> {
    const found = this.proveedores.find((p) => p.id === id);
    return Promise.resolve(found ?? null);
  }

  public crear(datos: DatosCrearProveedor): Promise<Proveedor> {
    const nuevo = new Proveedor(this.nextId++, datos.nombre, datos.contacto ?? null, true);
    this.proveedores.push(nuevo);
    return Promise.resolve(nuevo);
  }

  public actualizar(id: number, cambios: DatosActualizarProveedor): Promise<Proveedor> {
    const idx = this.proveedores.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Proveedor no encontrado');
    const actual = this.proveedores[idx];
    const actualizado = new Proveedor(
      actual.id,
      cambios.nombre !== undefined ? cambios.nombre : actual.nombre,
      cambios.contacto !== undefined ? cambios.contacto : actual.contacto,
      cambios.isActive !== undefined ? cambios.isActive : actual.isActive,
    );
    this.proveedores[idx] = actualizado;
    return Promise.resolve(actualizado);
  }

  public cambiarEstado(id: number, isActive: boolean): Promise<Proveedor> {
    return this.actualizar(id, { isActive });
  }
}

class FakeAuditoriaService implements IAuditoriaService {
  public eventos: EventoAuditoria[] = [];

  public registrar(evento: EventoAuditoria): Promise<void> {
    this.eventos.push(evento);
    return Promise.resolve();
  }
}

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

Deno.test('CrearProveedorUseCase: crea un proveedor y audita', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditoriaService();
  const useCase = new CrearProveedorUseCase(repo, audit);

  const res = await useCase.execute({
    nombre: 'Colanta',
    contacto: 'ventas@colanta.com.co',
    usuarioId: 'usr-admin-1',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Colanta');
  assertEquals(res.value.contacto, 'ventas@colanta.com.co');
  assertEquals(res.value.isActive, true);
  assertEquals(repo.proveedores.length, 1);

  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, 'CREAR');
  assertEquals(audit.eventos[0].entidad, 'proveedores');
  assertEquals(audit.eventos[0].usuarioId, 'usr-admin-1');
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

Deno.test('EditarProveedorUseCase: edita nombre y contacto y audita', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditoriaService();
  await repo.crear({ nombre: 'Postobón', contacto: 'antiguo@postobon.com' });

  const useCase = new EditarProveedorUseCase(repo, audit);
  const res = await useCase.execute({
    id: 1,
    nombre: 'Postobón S.A.',
    contacto: 'nuevo@postobon.com',
    usuarioId: 'usr-admin-2',
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Postobón S.A.');
  assertEquals(res.value.contacto, 'nuevo@postobon.com');
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, 'EDITAR');
});

Deno.test('EditarProveedorUseCase: falla si el id no existe', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditoriaService();
  const useCase = new EditarProveedorUseCase(repo, audit);

  const res = await useCase.execute({ id: 999, nombre: 'Inexistente' });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_NO_ENCONTRADO');
});

Deno.test('InactivarProveedorUseCase: cambia isActive a false y audita', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditoriaService();
  await repo.crear({ nombre: 'Coca-Cola FEMSA' });

  const useCase = new InactivarProveedorUseCase(repo, audit);
  const res = await useCase.execute({ id: 1, usuarioId: 'usr-super' });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.isActive, false);
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, 'INACTIVAR');
});

Deno.test('InactivarProveedorUseCase: falla si el proveedor no existe', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditoriaService();
  const useCase = new InactivarProveedorUseCase(repo, audit);

  const res = await useCase.execute({ id: 500 });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_NO_ENCONTRADO');
});

Deno.test('ReactivarProveedorUseCase: cambia isActive a true y audita', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditoriaService();
  const prov = await repo.crear({ nombre: 'Nestlé' });
  await repo.cambiarEstado(prov.id, false);

  const useCase = new ReactivarProveedorUseCase(repo, audit);
  const res = await useCase.execute({ id: prov.id, usuarioId: 'usr-super' });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.isActive, true);
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, 'REACTIVAR');
});

Deno.test('ReactivarProveedorUseCase: falla si el proveedor no existe', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditoriaService();
  const useCase = new ReactivarProveedorUseCase(repo, audit);

  const res = await useCase.execute({ id: 500 });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_NO_ENCONTRADO');
});

Deno.test('CambiarEstadoProveedorUseCase: delega correctamente según isActive', async () => {
  const repo = new FakeProveedorRepository();
  const audit = new FakeAuditoriaService();
  const inactivar = new InactivarProveedorUseCase(repo, audit);
  const reactivar = new ReactivarProveedorUseCase(repo, audit);
  const useCase = new CambiarEstadoProveedorUseCase(inactivar, reactivar);

  await repo.crear({ nombre: 'Colombina' });

  // Inactivar
  const resInact = await useCase.execute({ id: 1, isActive: false });
  assertEquals(resInact.isSuccess, true);
  assertEquals(resInact.value.isActive, false);

  // Reactivar
  const resAct = await useCase.execute({ id: 1, isActive: true });
  assertEquals(resAct.isSuccess, true);
  assertEquals(resAct.value.isActive, true);
});

Deno.test('ListarProveedoresUseCase: paginación, búsqueda y filtros', async () => {
  const repo = new FakeProveedorRepository();
  await repo.crear({ nombre: 'Alquería', contacto: 'info@alqueria.com' });
  await repo.crear({ nombre: 'Alpina', contacto: 'ventas@alpina.com' });
  const p3 = await repo.crear({ nombre: 'Pepsico', contacto: 'distribucion@pepsico.com' });
  await repo.cambiarEstado(p3.id, false); // Inactivo

  const useCase = new ListarProveedoresUseCase(repo);

  // 1. Listar sin filtros
  const resTodos = await useCase.execute({ page: 1, limit: 10 });
  assertEquals(resTodos.isSuccess, true);
  assertEquals(resTodos.value.total, 3);
  assertEquals(resTodos.value.items.length, 3);

  // 2. Búsqueda por nombre "al"
  const resBusqueda = await useCase.execute({ busqueda: 'al', page: 1, limit: 10 });
  assertEquals(resBusqueda.isSuccess, true);
  assertEquals(resBusqueda.value.total, 2);

  // 3. Filtro por activos
  const resActivos = await useCase.execute({ isActive: true, page: 1, limit: 10 });
  assertEquals(resActivos.isSuccess, true);
  assertEquals(resActivos.value.total, 2);

  // 4. Filtro por inactivos
  const resInactivos = await useCase.execute({ isActive: false, page: 1, limit: 10 });
  assertEquals(resInactivos.isSuccess, true);
  assertEquals(resInactivos.value.total, 1);
  assertEquals(resInactivos.value.items[0].nombre, 'Pepsico');

  // 5. Paginación
  const resPaginado = await useCase.execute({ page: 2, limit: 1 });
  assertEquals(resPaginado.isSuccess, true);
  assertEquals(resPaginado.value.page, 2);
  assertEquals(resPaginado.value.totalPages, 3);
  assertEquals(resPaginado.value.items.length, 1);

  // 6. Consulta de activos para catálogo de productos (punto de extensión)
  const activos = await repo.listarActivos();
  assertEquals(activos.length, 2);
});
