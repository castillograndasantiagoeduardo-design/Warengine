import { assertEquals } from 'jsr:@std/assert@^1';
import {
  Producto,
  Categoria,
  Proveedor,
  IProductoRepository,
  ICategoriaRepository,
  IProveedorRepository,
  DatosCrearProducto,
  DatosActualizarProducto,
  FiltrosListarProductos,
  ResultadoPaginado,
  CrearProductoUseCase,
  EditarProductoUseCase,
  InactivarProductoUseCase,
  ReactivarProductoUseCase,
  CambiarEstadoProductoUseCase,
  ListarProductosUseCase,
  ObtenerProductoPorIdUseCase,
  IAuditor,
  EventoAuditoria,
  ActorAuditoria,
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
} from '../../mod.ts';

// ─── Fake Repositories ────────────────────────────────────────────────────────

class FakeProductoRepository implements IProductoRepository {
  public productos: Producto[] = [];
  public productosConMovimientos = new Set<string>();
  public productosConStockBajo = new Set<string>();
  private nextId = 1;

  public listar(params: FiltrosListarProductos): Promise<ResultadoPaginado<Producto>> {
    let filtradas = [...this.productos];

    if (params.texto) {
      const q = params.texto.toLowerCase();
      filtradas = filtradas.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );
    }

    if (params.categoriaId !== undefined) {
      filtradas = filtradas.filter((p) => p.categoriaId === params.categoriaId);
    }

    if (params.proveedorId !== undefined) {
      filtradas = filtradas.filter((p) => p.proveedorId === params.proveedorId);
    }

    if (params.isActive !== undefined) {
      filtradas = filtradas.filter((p) => p.isActive === params.isActive);
    }

    if (params.stockBajo) {
      filtradas = filtradas.filter((p) => this.productosConStockBajo.has(p.id));
    }

    const total = filtradas.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const totalPages = Math.ceil(total / limit) || 1;
    const offset = (page - 1) * limit;
    const items = filtradas.slice(offset, offset + limit);

    return Promise.resolve({ items, total, page, limit, totalPages });
  }

  public findById(id: string): Promise<Producto | null> {
    const encontrada = this.productos.find((p) => p.id === id) ?? null;
    return Promise.resolve(encontrada);
  }

  public findBySku(sku: string): Promise<Producto | null> {
    const encontrada = this.productos.find((p) => p.sku === sku) ?? null;
    return Promise.resolve(encontrada);
  }

  public crear(datos: DatosCrearProducto): Promise<Producto> {
    const id = datos.id ?? `prod-${this.nextId++}`;
    const nuevo = new Producto(
      id,
      datos.sku,
      datos.nombre,
      datos.categoriaId ?? null,
      datos.proveedorId ?? null,
      datos.precioCompra,
      datos.precioVenta,
      datos.precioCorporativo ?? null,
      null,
      true,
    );
    this.productos.push(nuevo);
    return Promise.resolve(nuevo);
  }

  public actualizar(id: string, cambios: DatosActualizarProducto): Promise<Producto> {
    const idx = this.productos.findIndex((p) => p.id === id);
    const actual = this.productos[idx];
    const actualizada = new Producto(
      actual.id,
      cambios.sku ?? actual.sku,
      cambios.nombre ?? actual.nombre,
      cambios.categoriaId !== undefined ? cambios.categoriaId : actual.categoriaId,
      cambios.proveedorId !== undefined ? cambios.proveedorId : actual.proveedorId,
      cambios.precioCompra ?? actual.precioCompra,
      cambios.precioVenta ?? actual.precioVenta,
      cambios.precioCorporativo !== undefined ? cambios.precioCorporativo : actual.precioCorporativo,
      cambios.precioCorporativo !== undefined ? new Date() : actual.precioCorporativoActualizadoEn,
      cambios.isActive ?? actual.isActive,
    );
    this.productos[idx] = actualizada;
    return Promise.resolve(actualizada);
  }

  public cambiarEstado(id: string, isActive: boolean): Promise<Producto> {
    return this.actualizar(id, { isActive });
  }

  public tieneMovimientos(id: string): Promise<boolean> {
    return Promise.resolve(this.productosConMovimientos.has(id));
  }
}

class FakeCategoriaRepository implements ICategoriaRepository {
  public categorias: Categoria[] = [];

  public listar(): Promise<ResultadoPaginado<Categoria>> {
    return Promise.resolve({ items: this.categorias, total: this.categorias.length, page: 1, limit: 10, totalPages: 1 });
  }

  public listarActivos(): Promise<Categoria[]> {
    return Promise.resolve(this.categorias.filter((c) => c.isActive));
  }

  public findById(id: number): Promise<Categoria | null> {
    return Promise.resolve(this.categorias.find((c) => c.id === id) ?? null);
  }

  public crear(datos: { nombre: string }): Promise<Categoria> {
    const nueva = new Categoria(this.categorias.length + 1, datos.nombre, true);
    this.categorias.push(nueva);
    return Promise.resolve(nueva);
  }

  public actualizar(id: number, cambios: { nombre?: string; isActive?: boolean }): Promise<Categoria> {
    const idx = this.categorias.findIndex((c) => c.id === id);
    const actual = this.categorias[idx];
    const act = new Categoria(actual.id, cambios.nombre ?? actual.nombre, cambios.isActive ?? actual.isActive);
    this.categorias[idx] = act;
    return Promise.resolve(act);
  }

  public cambiarEstado(id: number, isActive: boolean): Promise<Categoria> {
    return this.actualizar(id, { isActive });
  }
}

class FakeProveedorRepository implements IProveedorRepository {
  public proveedores: Proveedor[] = [];

  public listar(): Promise<ResultadoPaginado<Proveedor>> {
    return Promise.resolve({ items: this.proveedores, total: this.proveedores.length, page: 1, limit: 10, totalPages: 1 });
  }

  public listarActivos(): Promise<Proveedor[]> {
    return Promise.resolve(this.proveedores.filter((p) => p.isActive));
  }

  public findById(id: number): Promise<Proveedor | null> {
    return Promise.resolve(this.proveedores.find((p) => p.id === id) ?? null);
  }

  public crear(datos: { nombre: string; contacto?: string | null }): Promise<Proveedor> {
    const nuevo = new Proveedor(this.proveedores.length + 1, datos.nombre, datos.contacto ?? null, true);
    this.proveedores.push(nuevo);
    return Promise.resolve(nuevo);
  }

  public actualizar(id: number, cambios: { nombre?: string; contacto?: string | null; isActive?: boolean }): Promise<Proveedor> {
    const idx = this.proveedores.findIndex((p) => p.id === id);
    const actual = this.proveedores[idx];
    const act = new Proveedor(
      actual.id,
      cambios.nombre ?? actual.nombre,
      cambios.contacto !== undefined ? cambios.contacto : actual.contacto,
      cambios.isActive ?? actual.isActive,
    );
    this.proveedores[idx] = act;
    return Promise.resolve(act);
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

const actor: ActorAuditoria = { usuarioId: 'usr-123', ip: '192.168.1.10' };

// ─── Tests ───────────────────────────────────────────────────────────────────

Deno.test('Producto Entity: métodos activar e inactivar', () => {
  const prod = new Producto('p-1', 'SKU-001', 'Arroz Diana', 1, 1, 2500, 3200, 3000, null, true);
  const inactivo = prod.inactivar();
  assertEquals(inactivo.isActive, false);
  assertEquals(inactivo.sku, 'SKU-001');

  const activo = inactivo.activar();
  assertEquals(activo.isActive, true);
});

Deno.test('CrearProductoUseCase: crea un producto y audita con convención despues', async () => {
  const prodRepo = new FakeProductoRepository();
  const catRepo = new FakeCategoriaRepository();
  catRepo.categorias.push(new Categoria(1, 'Granos', true));
  const provRepo = new FakeProveedorRepository();
  provRepo.proveedores.push(new Proveedor(1, 'Diana Corp', 'contacto@diana.com', true));
  const audit = new FakeAuditor();

  const useCase = new CrearProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    sku: 'SKU-ARROZ-1',
    nombre: 'Arroz Diana 1kg',
    categoriaId: 1,
    proveedorId: 1,
    precioCompra: 2800,
    precioVenta: 3500,
    precioCorporativo: 3300,
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.sku, 'SKU-ARROZ-1');
  assertEquals(res.value.nombre, 'Arroz Diana 1kg');
  assertEquals(res.value.isActive, true);

  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.CREAR);
  assertEquals(audit.eventos[0].entidad, ENTIDADES_AUDITORIA.PRODUCTOS);
  assertEquals(audit.eventos[0].entidadId, res.value.id);
  assertEquals((audit.eventos[0].detalles?.despues as any).sku, 'SKU-ARROZ-1');
  assertEquals((audit.eventos[0].detalles?.despues as any).precioVenta, 3500);
});

Deno.test('CrearProductoUseCase: falla si el SKU está duplicado y NO audita', async () => {
  const prodRepo = new FakeProductoRepository();
  await prodRepo.crear({
    sku: 'SKU-DUPLICADO',
    nombre: 'Original',
    precioCompra: 1000,
    precioVenta: 1500,
  });

  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new CrearProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    sku: 'SKU-DUPLICADO',
    nombre: 'Copia',
    precioCompra: 1000,
    precioVenta: 1500,
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'SKU_DUPLICADO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('CrearProductoUseCase: falla si la categoría no existe y NO audita', async () => {
  const prodRepo = new FakeProductoRepository();
  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new CrearProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    sku: 'SKU-001',
    nombre: 'Producto X',
    categoriaId: 999,
    precioCompra: 1000,
    precioVenta: 1500,
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CATEGORIA_NO_ENCONTRADA');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('CrearProductoUseCase: falla si la categoría está inactiva y NO audita', async () => {
  const prodRepo = new FakeProductoRepository();
  const catRepo = new FakeCategoriaRepository();
  catRepo.categorias.push(new Categoria(1, 'Inactiva', false));
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new CrearProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    sku: 'SKU-001',
    nombre: 'Producto X',
    categoriaId: 1,
    precioCompra: 1000,
    precioVenta: 1500,
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'CATEGORIA_INACTIVA');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('CrearProductoUseCase: falla si el proveedor no existe y NO audita', async () => {
  const prodRepo = new FakeProductoRepository();
  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new CrearProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    sku: 'SKU-001',
    nombre: 'Producto X',
    proveedorId: 999,
    precioCompra: 1000,
    precioVenta: 1500,
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_NO_ENCONTRADO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('CrearProductoUseCase: falla si el proveedor está inactivo y NO audita', async () => {
  const prodRepo = new FakeProductoRepository();
  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  provRepo.proveedores.push(new Proveedor(1, 'Inactivo Corp', null, false));
  const audit = new FakeAuditor();
  const useCase = new CrearProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    sku: 'SKU-001',
    nombre: 'Producto X',
    proveedorId: 1,
    precioCompra: 1000,
    precioVenta: 1500,
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PROVEEDOR_INACTIVO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('ObtenerProductoPorIdUseCase: retorna producto existente', async () => {
  const prodRepo = new FakeProductoRepository();
  const creado = await prodRepo.crear({
    sku: 'SKU-001',
    nombre: 'Aceite',
    precioCompra: 5000,
    precioVenta: 7000,
  });
  const useCase = new ObtenerProductoPorIdUseCase(prodRepo);

  const res = await useCase.execute({ id: creado.id });
  assertEquals(res.isSuccess, true);
  assertEquals(res.value.sku, 'SKU-001');
});

Deno.test('ObtenerProductoPorIdUseCase: falla con PRODUCTO_NO_ENCONTRADO si no existe', async () => {
  const prodRepo = new FakeProductoRepository();
  const useCase = new ObtenerProductoPorIdUseCase(prodRepo);

  const res = await useCase.execute({ id: 'inexistente-id' });
  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PRODUCTO_NO_ENCONTRADO');
});

Deno.test('EditarProductoUseCase: edita campos y audita con antes y despues', async () => {
  const prodRepo = new FakeProductoRepository();
  const creado = await prodRepo.crear({
    sku: 'SKU-001',
    nombre: 'Aceite Vegetal',
    precioCompra: 5000,
    precioVenta: 7000,
  });

  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new EditarProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    id: creado.id,
    nombre: 'Aceite Vegetal 900ml',
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.nombre, 'Aceite Vegetal 900ml');

  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.EDITAR);
  assertEquals((audit.eventos[0].detalles?.antes as any).nombre, 'Aceite Vegetal');
  assertEquals((audit.eventos[0].detalles?.despues as any).nombre, 'Aceite Vegetal 900ml');
});

Deno.test('EditarProductoUseCase: registra cambio de precio en detalle de auditoría con cambioPrecio', async () => {
  const prodRepo = new FakeProductoRepository();
  const creado = await prodRepo.crear({
    sku: 'SKU-001',
    nombre: 'Café',
    precioCompra: 8000,
    precioVenta: 12000,
    precioCorporativo: 11000,
  });

  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new EditarProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    id: creado.id,
    precioVenta: 13500,
    precioCorporativo: 12500,
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.precioVenta, 13500);
  assertEquals(res.value.precioCorporativo, 12500);

  assertEquals(audit.eventos.length, 1);
  const detalles = audit.eventos[0].detalles;
  assertEquals((detalles as any).cambioPrecio.precioVenta.antes, 12000);
  assertEquals((detalles as any).cambioPrecio.precioVenta.despues, 13500);
  assertEquals((detalles as any).cambioPrecio.precioCorporativo.antes, 11000);
  assertEquals((detalles as any).cambioPrecio.precioCorporativo.despues, 12500);
});

Deno.test('EditarProductoUseCase: falla si el producto no existe y NO audita', async () => {
  const prodRepo = new FakeProductoRepository();
  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new EditarProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    id: 'id-inexistente',
    nombre: 'Nuevo Nombre',
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PRODUCTO_NO_ENCONTRADO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('EditarProductoUseCase: no permite SKU duplicado y NO audita', async () => {
  const prodRepo = new FakeProductoRepository();
  const p1 = await prodRepo.crear({ sku: 'SKU-A', nombre: 'A', precioCompra: 10, precioVenta: 20 });
  await prodRepo.crear({ sku: 'SKU-B', nombre: 'B', precioCompra: 10, precioVenta: 20 });

  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new EditarProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    id: p1.id,
    sku: 'SKU-B',
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'SKU_DUPLICADO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('EditarProductoUseCase: no permite cambiar SKU si el producto tiene movimientos', async () => {
  const prodRepo = new FakeProductoRepository();
  const p1 = await prodRepo.crear({ sku: 'SKU-ORIGINAL', nombre: 'A', precioCompra: 10, precioVenta: 20 });
  prodRepo.productosConMovimientos.add(p1.id);

  const catRepo = new FakeCategoriaRepository();
  const provRepo = new FakeProveedorRepository();
  const audit = new FakeAuditor();
  const useCase = new EditarProductoUseCase(prodRepo, catRepo, provRepo, audit);

  const res = await useCase.execute({
    id: p1.id,
    sku: 'SKU-NUEVO',
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'SKU_MODIFICACION_NO_PERMITIDA');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('InactivarProductoUseCase: cambia isActive a false y audita antes y despues', async () => {
  const prodRepo = new FakeProductoRepository();
  const creado = await prodRepo.crear({ sku: 'SKU-001', nombre: 'Jabón', precioCompra: 1000, precioVenta: 2000 });
  const audit = new FakeAuditor();
  const useCase = new InactivarProductoUseCase(prodRepo, audit);

  const res = await useCase.execute({ id: creado.id, actor });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.isActive, false);

  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.INACTIVAR);
  assertEquals((audit.eventos[0].detalles?.antes as any).isActive, true);
  assertEquals((audit.eventos[0].detalles?.despues as any).isActive, false);
});

Deno.test('InactivarProductoUseCase: falla si el producto no existe y NO audita', async () => {
  const prodRepo = new FakeProductoRepository();
  const audit = new FakeAuditor();
  const useCase = new InactivarProductoUseCase(prodRepo, audit);

  const res = await useCase.execute({ id: 'no-existe', actor });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'PRODUCTO_NO_ENCONTRADO');
  assertEquals(audit.eventos.length, 0);
});

Deno.test('InactivarProductoUseCase: inactivar dos veces audita coherentemente', async () => {
  const prodRepo = new FakeProductoRepository();
  const creado = await prodRepo.crear({ sku: 'SKU-001', nombre: 'Jabón', precioCompra: 1000, precioVenta: 2000 });
  const audit = new FakeAuditor();
  const useCase = new InactivarProductoUseCase(prodRepo, audit);

  await useCase.execute({ id: creado.id, actor });
  const res2 = await useCase.execute({ id: creado.id, actor });

  assertEquals(res2.isSuccess, true);
  assertEquals(res2.value.isActive, false);
  assertEquals(audit.eventos.length, 2);
  assertEquals((audit.eventos[1].detalles?.antes as any).isActive, false);
  assertEquals((audit.eventos[1].detalles?.despues as any).isActive, false);
});

Deno.test('ReactivarProductoUseCase: cambia isActive a true y audita con activar', async () => {
  const prodRepo = new FakeProductoRepository();
  const creado = await prodRepo.crear({ sku: 'SKU-001', nombre: 'Jabón', precioCompra: 1000, precioVenta: 2000 });
  await prodRepo.cambiarEstado(creado.id, false);
  const audit = new FakeAuditor();
  const useCase = new ReactivarProductoUseCase(prodRepo, audit);

  const res = await useCase.execute({ id: creado.id, actor });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.isActive, true);

  assertEquals(audit.eventos.length, 1);
  assertEquals(audit.eventos[0].accion, ACCIONES_AUDITORIA.ACTIVAR);
  assertEquals((audit.eventos[0].detalles?.antes as any).isActive, false);
  assertEquals((audit.eventos[0].detalles?.despues as any).isActive, true);
});

Deno.test('CambiarEstadoProductoUseCase: delega correctamente según isActive', async () => {
  const prodRepo = new FakeProductoRepository();
  const creado = await prodRepo.crear({ sku: 'SKU-001', nombre: 'Jabón', precioCompra: 1000, precioVenta: 2000 });
  const audit = new FakeAuditor();
  const inact = new InactivarProductoUseCase(prodRepo, audit);
  const react = new ReactivarProductoUseCase(prodRepo, audit);
  const useCase = new CambiarEstadoProductoUseCase(inact, react);

  const r1 = await useCase.execute({ id: creado.id, isActive: false, actor });
  assertEquals(r1.isSuccess, true);
  assertEquals(r1.value.isActive, false);

  const r2 = await useCase.execute({ id: creado.id, isActive: true, actor });
  assertEquals(r2.isSuccess, true);
  assertEquals(r2.value.isActive, true);
});

Deno.test('ListarProductosUseCase: paginación y filtros de búsqueda', async () => {
  const prodRepo = new FakeProductoRepository();
  const p1 = await prodRepo.crear({ sku: 'SKU-ARROZ-1', nombre: 'Arroz Diana', categoriaId: 1, proveedorId: 1, precioCompra: 2000, precioVenta: 3000 });
  const p2 = await prodRepo.crear({ sku: 'SKU-ARROZ-2', nombre: 'Arroz Roa', categoriaId: 1, proveedorId: 2, precioCompra: 2100, precioVenta: 3100 });
  await prodRepo.crear({ sku: 'SKU-ACEITE-1', nombre: 'Aceite Gourmet', categoriaId: 2, proveedorId: 1, precioCompra: 6000, precioVenta: 8000 });

  prodRepo.productosConStockBajo.add(p1.id);
  await prodRepo.cambiarEstado(p2.id, false);

  const useCase = new ListarProductosUseCase(prodRepo);

  // Filtro por texto
  const resTexto = await useCase.execute({ texto: 'arroz', page: 1, limit: 10 });
  assertEquals(resTexto.isSuccess, true);
  assertEquals(resTexto.value.items.length, 2);

  // Filtro por categoría
  const resCat = await useCase.execute({ categoriaId: 2, page: 1, limit: 10 });
  assertEquals(resCat.isSuccess, true);
  assertEquals(resCat.value.items.length, 1);
  assertEquals(resCat.value.items[0].nombre, 'Aceite Gourmet');

  // Filtro por proveedor
  const resProv = await useCase.execute({ proveedorId: 2, page: 1, limit: 10 });
  assertEquals(resProv.isSuccess, true);
  assertEquals(resProv.value.items.length, 1);
  assertEquals(resProv.value.items[0].nombre, 'Arroz Roa');

  // Filtro por estado activo
  const resActivos = await useCase.execute({ isActive: true, page: 1, limit: 10 });
  assertEquals(resActivos.isSuccess, true);
  assertEquals(resActivos.value.items.length, 2);

  // Filtro por stock bajo
  const resStockBajo = await useCase.execute({ stockBajo: true, page: 1, limit: 10 });
  assertEquals(resStockBajo.isSuccess, true);
  assertEquals(resStockBajo.value.items.length, 1);
  assertEquals(resStockBajo.value.items[0].id, p1.id);
});
