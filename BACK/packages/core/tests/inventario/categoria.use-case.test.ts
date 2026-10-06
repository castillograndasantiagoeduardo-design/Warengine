import { assertEquals } from 'jsr:@std/assert@^1';
import {
  Categoria,
  CategoriaNoEncontradaError,
  CambiarEstadoCategoriaUseCase,
  CrearCategoriaUseCase,
  DatosActualizarCategoria,
  DatosCrearCategoria,
  EditarCategoriaUseCase,
  EventoAuditoria,
  FiltrosListarCategorias,
  IAuditoriaService,
  ICategoriaRepository,
  InactivarCategoriaUseCase,
  ListarCategoriasUseCase,
  ObtenerCategoriaPorIdUseCase,
  ReactivarCategoriaUseCase,
  ResultadoPaginado,
} from '../../mod.ts';

// ─── Fake In-Memory Repository & Audit ──────────────────────────────────────

class FakeCategoriaRepository implements ICategoriaRepository {
  public categorias: Categoria[] = [];
  private nextId = 1;

  public listar(filtros: FiltrosListarCategorias): Promise<ResultadoPaginado<Categoria>> {
    let filtradas = [...this.categorias];

    if (filtros.busqueda) {
      const q = filtros.busqueda.toLowerCase();
      filtradas = filtradas.filter((c) => c.nombre.toLowerCase().includes(q));
    }

    if (filtros.isActive !== undefined) {
      filtradas = filtradas.filter((c) => c.isActive === filtros.isActive);
    }

    const total = filtradas.length;
    const page = Math.max(1, filtros.page);
    const limit = Math.max(1, filtros.limit);
    const offset = (page - 1) * limit;
    const items = filtradas.slice(offset, offset + limit);
    const totalPages = Math.ceil(total / limit) || 1;

    return Promise.resolve({
      items,
      total,
      page,
      limit,
      totalPages,
    });
  }

  public listarActivos(): Promise<Categoria[]> {
    return Promise.resolve(this.categorias.filter((c) => c.isActive));
  }

  public findById(id: number): Promise<Categoria | null> {
    const found = this.categorias.find((c) => c.id === id);
    return Promise.resolve(found ?? null);
  }

  public crear(datos: DatosCrearCategoria): Promise<Categoria> {
    const nueva = new Categoria(this.nextId++, datos.nombre, true);
    this.categorias.push(nueva);
    return Promise.resolve(nueva);
  }

  public actualizar(id: number, cambios: DatosActualizarCategoria): Promise<Categoria> {
    const idx = this.categorias.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Categoria no encontrada');
    const actual = this.categorias[idx];
    const actualizada = new Categoria(
      actual.id,
      cambios.nombre !== undefined ? cambios.nombre : actual.nombre,
      cambios.isActive !== undefined ? cambios.isActive : actual.isActive,
    );
    this.categorias[idx] = actualizada;
    return Promise.resolve(actualizada);
  }

  public cambiarEstado(id: number, isActive: boolean): Promise<Categoria> {
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

Deno.test('Categoria Entity: métodos activar e inactivar', () => {
  const cat = new Categoria(1, 'Bebidas', true);
  const inactiva = cat.inactivar();
  assertEquals(inactiva.isActive, false);
  assertEquals(inactiva.nombre, 'Bebidas');

  const activa = inactiva.activar();
  assertEquals(activa.isActive, true);
});

Deno.test('CrearCategoriaUseCase: crea una categoría y audita la acción', async () => {
  const repo = new FakeCategoriaRepository();
  const audit = new FakeAuditoriaService();
  const useCase = new CrearCategoriaUseCase(repo, audit);

  const res = await useCase.execute({ nombre: 'Lácteos', usuarioId: 'usr-123' });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Lácteos');
  assertEquals(res.value.isActive, true);
  assertEquals(repo.categorias.length, 1);

  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, 'CREAR');
  assertEquals(audit.eventos[0].entidad, 'categorias');
  assertEquals(audit.eventos[0].usuarioId, 'usr-123');
});

Deno.test('ObtenerCategoriaPorIdUseCase: retorna categoría existente', async () => {
  const repo = new FakeCategoriaRepository();
  await repo.crear({ nombre: 'Ferretería' });
  const useCase = new ObtenerCategoriaPorIdUseCase(repo);

  const res = await useCase.execute({ id: 1 });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Ferretería');
});

Deno.test('ObtenerCategoriaPorIdUseCase: falla con CATEGORIA_NO_ENCONTRADA si no existe', async () => {
  const repo = new FakeCategoriaRepository();
  const useCase = new ObtenerCategoriaPorIdUseCase(repo);

  const res = await useCase.execute({ id: 999 });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CATEGORIA_NO_ENCONTRADA');
});

Deno.test('EditarCategoriaUseCase: edita campos y audita', async () => {
  const repo = new FakeCategoriaRepository();
  const audit = new FakeAuditoriaService();
  await repo.crear({ nombre: 'Carnes' });

  const useCase = new EditarCategoriaUseCase(repo, audit);
  const res = await useCase.execute({ id: 1, nombre: 'Carnes Frías', usuarioId: 'usr-1' });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Carnes Frías');
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, 'EDITAR');
});

Deno.test('EditarCategoriaUseCase: falla si el id no existe', async () => {
  const repo = new FakeCategoriaRepository();
  const audit = new FakeAuditoriaService();
  const useCase = new EditarCategoriaUseCase(repo, audit);

  const res = await useCase.execute({ id: 99, nombre: 'No existe' });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CATEGORIA_NO_ENCONTRADA');
});

Deno.test('InactivarCategoriaUseCase: cambia isActive a false y audita', async () => {
  const repo = new FakeCategoriaRepository();
  const audit = new FakeAuditoriaService();
  await repo.crear({ nombre: 'Panadería' });

  const useCase = new InactivarCategoriaUseCase(repo, audit);
  const res = await useCase.execute({ id: 1, usuarioId: 'usr-admin' });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.isActive, false);
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, 'INACTIVAR');
});

Deno.test('InactivarCategoriaUseCase: falla si la categoría no existe', async () => {
  const repo = new FakeCategoriaRepository();
  const audit = new FakeAuditoriaService();
  const useCase = new InactivarCategoriaUseCase(repo, audit);

  const res = await useCase.execute({ id: 404 });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CATEGORIA_NO_ENCONTRADA');
});

Deno.test('ReactivarCategoriaUseCase: cambia isActive a true y audita', async () => {
  const repo = new FakeCategoriaRepository();
  const audit = new FakeAuditoriaService();
  const cat = await repo.crear({ nombre: 'Aseo' });
  await repo.cambiarEstado(cat.id, false);

  const useCase = new ReactivarCategoriaUseCase(repo, audit);
  const res = await useCase.execute({ id: cat.id, usuarioId: 'usr-admin' });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.isActive, true);
  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, 'REACTIVAR');
});

Deno.test('ReactivarCategoriaUseCase: falla si la categoría no existe', async () => {
  const repo = new FakeCategoriaRepository();
  const audit = new FakeAuditoriaService();
  const useCase = new ReactivarCategoriaUseCase(repo, audit);

  const res = await useCase.execute({ id: 404 });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CATEGORIA_NO_ENCONTRADA');
});

Deno.test('CambiarEstadoCategoriaUseCase: delega correctamente según isActive', async () => {
  const repo = new FakeCategoriaRepository();
  const audit = new FakeAuditoriaService();
  const inactivar = new InactivarCategoriaUseCase(repo, audit);
  const reactivar = new ReactivarCategoriaUseCase(repo, audit);
  const useCase = new CambiarEstadoCategoriaUseCase(inactivar, reactivar);

  await repo.crear({ nombre: 'Snacks' });

  // Inactivar
  const resInact = await useCase.execute({ id: 1, isActive: false });
  assertEquals(resInact.isSuccess, true);
  assertEquals(resInact.value.isActive, false);

  // Reactivar
  const resAct = await useCase.execute({ id: 1, isActive: true });
  assertEquals(resAct.isSuccess, true);
  assertEquals(resAct.value.isActive, true);
});

Deno.test('ListarCategoriasUseCase: paginación y filtros de búsqueda', async () => {
  const repo = new FakeCategoriaRepository();
  await repo.crear({ nombre: 'Bebidas Calientes' });
  await repo.crear({ nombre: 'Bebidas Frías' });
  const cat3 = await repo.crear({ nombre: 'Snacks Dulces' });
  await repo.cambiarEstado(cat3.id, false); // inactiva

  const useCase = new ListarCategoriasUseCase(repo);

  // 1. Sin filtros
  const resTodos = await useCase.execute({ page: 1, limit: 10 });
  assertEquals(resTodos.isSuccess, true);
  assertEquals(resTodos.value.total, 3);
  assertEquals(resTodos.value.items.length, 3);

  // 2. Búsqueda por texto "bebidas"
  const resBusqueda = await useCase.execute({ busqueda: 'bebidas', page: 1, limit: 10 });
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
  assertEquals(resInactivos.value.items[0].nombre, 'Snacks Dulces');

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
