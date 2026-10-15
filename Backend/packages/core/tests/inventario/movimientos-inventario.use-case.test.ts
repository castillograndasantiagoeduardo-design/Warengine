import { assertEquals } from 'jsr:@std/assert';
import {
  CantidadInvalidaError,
  ConsultarKardexUseCase,
  DatosRegistroEntrada,
  DatosRegistroSalida,
  FiltrosKardex,
  IAuditor,
  IMovimientoInventarioRepository,
  IProductoRepository,
  IProveedorRepository,
  ISucursalRepository,
  ItemKardex,
  MotivoSalidaRequeridoError,
  MovimientoInventario,
  Producto,
  ProductoInactivoError,
  ProductoNoEncontradoError,
  Proveedor,
  ProveedorInactivoError,
  ProveedorNoEncontradoError,
  RegistrarEntradaInventarioUseCase,
  RegistrarSalidaInventarioUseCase,
  StockInsuficienteError,
  Sucursal,
  SucursalFueraDeAlcanceError,
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../mod.ts';

// ─── Mocks en memoria ────────────────────────────────────────────────────────

class InMemoryMovimientoRepository implements IMovimientoInventarioRepository {
  public stock: Map<string, number> = new Map();
  public movimientos: MovimientoInventario[] = [];
  private seq = 0;

  private key(productoId: string, sucursalId: number): string {
    return `${productoId}__${sucursalId}`;
  }

  public setStock(productoId: string, sucursalId: number, cantidad: number) {
    this.stock.set(this.key(productoId, sucursalId), cantidad);
  }

  public async obtenerStockActual(productoId: string, sucursalId: number): Promise<number> {
    return this.stock.get(this.key(productoId, sucursalId)) ?? 0;
  }

  public async registrarEntrada(datos: DatosRegistroEntrada): Promise<MovimientoInventario> {
    const k = this.key(datos.productoId, datos.sucursalId);
    const actual = this.stock.get(k) ?? 0;
    const nuevo = actual + datos.cantidad;
    this.stock.set(k, nuevo);
    this.seq++;

    const mov: MovimientoInventario = {
      id: `mov-entrada-${this.seq}`,
      productoId: datos.productoId,
      sucursalId: datos.sucursalId,
      tipo: 'entrada',
      cantidad: datos.cantidad,
      motivo: datos.motivo ?? null,
      proveedorId: datos.proveedorId ?? null,
      usuarioId: datos.usuarioId,
      fecha: new Date(Date.now() + this.seq * 1000),
      stockResultante: nuevo,
    };
    this.movimientos.push(mov);
    return mov;
  }

  public async registrarSalida(datos: DatosRegistroSalida): Promise<MovimientoInventario> {
    const k = this.key(datos.productoId, datos.sucursalId);
    const actual = this.stock.get(k) ?? 0;
    if (actual < datos.cantidad) {
      throw new StockInsuficienteError(actual, datos.cantidad);
    }
    const nuevo = actual - datos.cantidad;
    this.stock.set(k, nuevo);
    this.seq++;

    const mov: MovimientoInventario = {
      id: `mov-salida-${this.seq}`,
      productoId: datos.productoId,
      sucursalId: datos.sucursalId,
      tipo: 'salida',
      cantidad: datos.cantidad,
      motivo: datos.motivo,
      usuarioId: datos.usuarioId,
      fecha: new Date(Date.now() + this.seq * 1000),
      stockResultante: nuevo,
    };
    this.movimientos.push(mov);
    return mov;
  }

  public async consultarKardex(filtros: FiltrosKardex): Promise<{ items: ItemKardex[]; total: number }> {
    let items = [...this.movimientos];

    if (filtros.productoId) {
      items = items.filter((m) => m.productoId === filtros.productoId);
    }
    if (filtros.sucursalId !== undefined) {
      items = items.filter((m) => m.sucursalId === filtros.sucursalId);
    } else if (filtros.sucursalIds && filtros.sucursalIds.length > 0) {
      items = items.filter((m) => filtros.sucursalIds!.includes(m.sucursalId));
    }
    if (filtros.tipo) {
      items = items.filter((m) => m.tipo === filtros.tipo);
    }
    if (filtros.desde) {
      items = items.filter((m) => m.fecha >= filtros.desde!);
    }
    if (filtros.hasta) {
      items = items.filter((m) => m.fecha <= filtros.hasta!);
    }

    // Ordenar cronológicamente descendente
    items.sort((a, b) => b.fecha.getTime() - a.fecha.getTime());

    const total = items.length;
    const paginados = items.slice(filtros.offset, filtros.offset + filtros.limit);

    return {
      items: paginados.map((m) => ({
        id: m.id,
        productoId: m.productoId,
        sucursalId: m.sucursalId,
        tipo: m.tipo,
        cantidad: m.cantidad,
        motivo: m.motivo,
        proveedorId: m.proveedorId,
        usuarioId: m.usuarioId,
        fecha: m.fecha,
      })),
      total,
    };
  }
}

class InMemoryProductoRepository implements Partial<IProductoRepository> {
  public productos = new Map<string, Producto>();

  public async findById(id: string): Promise<Producto | null> {
    return this.productos.get(id) ?? null;
  }
}

class InMemorySucursalRepository implements Partial<ISucursalRepository> {
  public sucursales = new Map<number, Sucursal>();

  public async findById(id: number): Promise<Sucursal | null> {
    return this.sucursales.get(id) ?? null;
  }
}

class InMemoryProveedorRepository implements Partial<IProveedorRepository> {
  public proveedores = new Map<number, Proveedor>();

  public async findById(id: number): Promise<Proveedor | null> {
    return this.proveedores.get(id) ?? null;
  }
}

class MockAuditor implements IAuditor {
  public logs: any[] = [];
  public async registrar(log: any): Promise<void> {
    this.logs.push(log);
  }
}

function crearEscenario() {
  const movRepo = new InMemoryMovimientoRepository();
  const prodRepo = new InMemoryProductoRepository();
  const sucRepo = new InMemorySucursalRepository();
  const provRepo = new InMemoryProveedorRepository();
  const auditor = new MockAuditor();

  const productoActivo = new Producto(
    'prod-1',
    'SKU-001',
    'Taladro Percutor',
    null,
    1,
    100,
    150,
    null,
    null,
    true,
  );
  prodRepo.productos.set('prod-1', productoActivo);

  const productoInactivo = new Producto(
    'prod-inactivo',
    'SKU-INACTIVO',
    'Taladro Descontinuado',
    null,
    1,
    80,
    120,
    null,
    null,
    false,
  );
  prodRepo.productos.set('prod-inactivo', productoInactivo);

  const sucursalActiva = new Sucursal(1, 'Sede Norte', 'Calle 100', '1234567', true);
  const sucursalInactiva = new Sucursal(2, 'Sede Clausurada', 'Carrera 7', '7654321', false);
  sucRepo.sucursales.set(1, sucursalActiva);
  sucRepo.sucursales.set(2, sucursalInactiva);

  const proveedorActivo = new Proveedor(1, 'Herramientas SA', 'contacto@herramientas.com', true);
  const proveedorInactivo = new Proveedor(2, 'Proveedor Quebrado', null, false);
  provRepo.proveedores.set(1, proveedorActivo);
  provRepo.proveedores.set(2, proveedorInactivo);

  const entradaUseCase = new RegistrarEntradaInventarioUseCase(
    movRepo,
    prodRepo as any,
    sucRepo as any,
    provRepo as any,
    auditor,
  );

  const salidaUseCase = new RegistrarSalidaInventarioUseCase(
    movRepo,
    prodRepo as any,
    sucRepo as any,
    auditor,
  );

  const kardexUseCase = new ConsultarKardexUseCase(movRepo);

  const actor = { usuarioId: 'user-admin-1', ip: '127.0.0.1' };

  return { movRepo, prodRepo, sucRepo, provRepo, auditor, entradaUseCase, salidaUseCase, kardexUseCase, actor };
}

// ─── Tests: Entradas de Inventario (RF-ADM-B7) ──────────────────────────────

Deno.test('Entrada: registra ingreso exitoso e incrementa stock en la sucursal', async () => {
  const { entradaUseCase, movRepo, auditor, actor } = crearEscenario();
  movRepo.setStock('prod-1', 1, 10);

  const result = await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 15,
    proveedorId: 1,
    motivo: 'Compra según factura F-1234',
    actor,
  });

  assertEquals(result.isSuccess, true);
  const mov = result.value;
  assertEquals(mov.tipo, 'entrada');
  assertEquals(mov.cantidad, 15);
  assertEquals(mov.stockResultante, 25);

  const stockActual = await movRepo.obtenerStockActual('prod-1', 1);
  assertEquals(stockActual, 25);

  // Verifica auditoría emitida
  assertEquals(auditor.logs.length, 1);
  assertEquals(auditor.logs[0].entidadId, 'prod-1');
  assertEquals(auditor.logs[0].detalles.antes.stockActual, 10);
  assertEquals(auditor.logs[0].detalles.despues.stockActual, 25);
  assertEquals(auditor.logs[0].detalles.tipoMovimiento, 'entrada');
});

Deno.test('Entrada: rechaza cantidad menor o igual a cero o no entera', async () => {
  const { entradaUseCase, actor } = crearEscenario();

  const res1 = await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 0,
    actor,
  });
  assertEquals(res1.isSuccess, false);
  assertEquals(res1.error instanceof CantidadInvalidaError, true);

  const res2 = await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: -5,
    actor,
  });
  assertEquals(res2.isSuccess, false);
  assertEquals(res2.error instanceof CantidadInvalidaError, true);

  const res3 = await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 3.5,
    actor,
  });
  assertEquals(res3.isSuccess, false);
  assertEquals(res3.error instanceof CantidadInvalidaError, true);
});

Deno.test('Entrada: rechaza si el producto no existe', async () => {
  const { entradaUseCase, actor } = crearEscenario();

  const res = await entradaUseCase.execute({
    productoId: 'prod-fantasma',
    sucursalId: 1,
    cantidad: 10,
    actor,
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof ProductoNoEncontradoError, true);
});

Deno.test('Entrada: rechaza si la sucursal no existe o está inactiva', async () => {
  const { entradaUseCase, actor } = crearEscenario();

  const resInexistente = await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 999,
    cantidad: 10,
    actor,
  });
  assertEquals(resInexistente.isSuccess, false);
  assertEquals(resInexistente.error instanceof SucursalNoEncontradaError, true);

  const resInactiva = await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 2,
    cantidad: 10,
    actor,
  });
  assertEquals(resInactiva.isSuccess, false);
  assertEquals(resInactiva.error instanceof SucursalInactivaError, true);
});

Deno.test('Entrada: rechaza si el proveedor no existe o está inactivo', async () => {
  const { entradaUseCase, actor } = crearEscenario();

  const resProvInexistente = await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    proveedorId: 999,
    cantidad: 10,
    actor,
  });
  assertEquals(resProvInexistente.isSuccess, false);
  assertEquals(resProvInexistente.error instanceof ProveedorNoEncontradoError, true);

  const resProvInactivo = await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    proveedorId: 2,
    cantidad: 10,
    actor,
  });
  assertEquals(resProvInactivo.isSuccess, false);
  assertEquals(resProvInactivo.error instanceof ProveedorInactivoError, true);
});

Deno.test('Entrada (RF-ADM-B7): rechaza si el producto está inactivo en catálogo maestro', async () => {
  const { entradaUseCase, actor } = crearEscenario();

  const res = await entradaUseCase.execute({
    productoId: 'prod-inactivo',
    sucursalId: 1,
    cantidad: 10,
    actor,
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof ProductoInactivoError, true);
});

Deno.test('Entrada (RF-ADM-B7 / RNF-ADM-04): rechaza si la sucursal está fuera del alcance del usuario', async () => {
  const { movRepo, prodRepo, sucRepo, provRepo, auditor } = crearEscenario();

  // Mock de ResolverAlcanceSucursal que solo autoriza la sucursal 1
  const mockResolverAlcance = {
    execute: async () => ({
      isSuccess: true,
      isFailure: false,
      value: {
        permite: (sucursalId: number) => sucursalId === 1,
      },
    }),
  } as any;

  const entradaConAlcance = new RegistrarEntradaInventarioUseCase(
    movRepo,
    prodRepo as any,
    sucRepo as any,
    provRepo as any,
    auditor,
    mockResolverAlcance,
  );

  // Intento de entrada en sucursal 2 (fuera de alcance del usuario)
  const res = await entradaConAlcance.execute({
    productoId: 'prod-1',
    sucursalId: 2,
    cantidad: 10,
    actor: { usuarioId: 'user-admin-sucursal-1', ip: '127.0.0.1' },
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof SucursalFueraDeAlcanceError, true);
});

// ─── Tests: Salidas de Inventario y Stock No Negativo (RF-ADM-B8, B9) ────────

Deno.test('Salida: descuenta unidades cuando hay existencias suficientes', async () => {
  const { salidaUseCase, movRepo, auditor, actor } = crearEscenario();
  movRepo.setStock('prod-1', 1, 20);

  const result = await salidaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 5,
    motivo: 'Avería durante transporte interno',
    actor,
  });

  assertEquals(result.isSuccess, true);
  const mov = result.value;
  assertEquals(mov.tipo, 'salida');
  assertEquals(mov.cantidad, 5);
  assertEquals(mov.stockResultante, 15);

  const stockActual = await movRepo.obtenerStockActual('prod-1', 1);
  assertEquals(stockActual, 15);

  assertEquals(auditor.logs.length, 1);
  assertEquals(auditor.logs[0].detalles.antes.stockActual, 20);
  assertEquals(auditor.logs[0].detalles.despues.stockActual, 15);
  assertEquals(auditor.logs[0].detalles.motivo, 'Avería durante transporte interno');
});

Deno.test('Salida (RF-ADM-B9): bloquea la operación si el stock disponible es menor a la cantidad solicitada', async () => {
  const { salidaUseCase, movRepo, auditor, actor } = crearEscenario();
  movRepo.setStock('prod-1', 1, 4);

  const result = await salidaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 5,
    motivo: 'Merma por embalaje roto',
    actor,
  });

  assertEquals(result.isSuccess, false);
  assertEquals(result.error instanceof StockInsuficienteError, true);
  assertEquals(result.error.code, 'STOCK_INSUFICIENTE');

  // El stock debe permanecer inalterado
  const stockActual = await movRepo.obtenerStockActual('prod-1', 1);
  assertEquals(stockActual, 4);

  // No debe registrar auditoría
  assertEquals(auditor.logs.length, 0);
});

Deno.test('Salida (RF-ADM-B8): exige justificación / motivo obligatorio', async () => {
  const { salidaUseCase, movRepo, actor } = crearEscenario();
  movRepo.setStock('prod-1', 1, 10);

  const resVacio = await salidaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 2,
    motivo: '',
    actor,
  });
  assertEquals(resVacio.isSuccess, false);
  assertEquals(resVacio.error instanceof MotivoSalidaRequeridoError, true);

  const resCorto = await salidaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 2,
    motivo: 'ab',
    actor,
  });
  assertEquals(resCorto.isSuccess, false);
  assertEquals(resCorto.error instanceof MotivoSalidaRequeridoError, true);
});

Deno.test('Salida: rechaza cantidad menor o igual a cero', async () => {
  const { salidaUseCase, movRepo, actor } = crearEscenario();
  movRepo.setStock('prod-1', 1, 10);

  const res = await salidaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: -2,
    motivo: 'Devolución fallida',
    actor,
  });
  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof CantidadInvalidaError, true);
});

Deno.test('Salida (RF-ADM-B8): rechaza si el producto está inactivo en catálogo', async () => {
  const { salidaUseCase, actor } = crearEscenario();

  const res = await salidaUseCase.execute({
    productoId: 'prod-inactivo',
    sucursalId: 1,
    cantidad: 2,
    motivo: 'Descarte por daño',
    actor,
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof ProductoInactivoError, true);
});

Deno.test('Salida (RF-ADM-B8 / RNF-ADM-04): rechaza si la sucursal está fuera del alcance del usuario', async () => {
  const { movRepo, prodRepo, sucRepo, auditor } = crearEscenario();

  const mockResolverAlcance = {
    execute: async () => ({
      isSuccess: true,
      isFailure: false,
      value: {
        permite: (sucursalId: number) => sucursalId === 1,
      },
    }),
  } as any;

  const salidaConAlcance = new RegistrarSalidaInventarioUseCase(
    movRepo,
    prodRepo as any,
    sucRepo as any,
    auditor,
    mockResolverAlcance,
  );

  const res = await salidaConAlcance.execute({
    productoId: 'prod-1',
    sucursalId: 2,
    cantidad: 2,
    motivo: 'Merma en bodega ajena',
    actor: { usuarioId: 'user-admin-sucursal-1', ip: '127.0.0.1' },
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof SucursalFueraDeAlcanceError, true);
});

// ─── Tests: Historial de Movimientos / Kardex (RF-ADM-B10) ───────────────────

Deno.test('Kardex (RF-ADM-B10): consulta cronológica de entradas y salidas ordenadas descendentemente', async () => {
  const { movRepo, entradaUseCase, salidaUseCase, kardexUseCase, actor } = crearEscenario();

  // 1. Sembrar entrada
  await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 20,
    proveedorId: 1,
    motivo: 'Compra de lote 1',
    actor,
  });

  // 2. Sembrar salida
  await salidaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 5,
    motivo: 'Salida por merma',
    actor,
  });

  // 3. Consultar kardex
  const result = await kardexUseCase.execute({
    limit: 10,
    offset: 0,
    actor,
  });

  assertEquals(result.isSuccess, true);
  const data = result.value;
  assertEquals(data.total, 2);
  assertEquals(data.items.length, 2);
  // El más reciente primero
  assertEquals(data.items[0].tipo, 'salida');
  assertEquals(data.items[0].cantidad, 5);
  assertEquals(data.items[1].tipo, 'entrada');
  assertEquals(data.items[1].cantidad, 20);
});

Deno.test('Kardex (RF-ADM-B10): filtra correctamente por productoId y tipo de movimiento', async () => {
  const { movRepo, entradaUseCase, salidaUseCase, kardexUseCase, actor } = crearEscenario();

  await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 15,
    actor,
  });
  await salidaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 2,
    motivo: 'Avería',
    actor,
  });

  // Filtrar solo entradas
  const resEntradas = await kardexUseCase.execute({
    productoId: 'prod-1',
    tipo: 'entrada',
    limit: 10,
    offset: 0,
    actor,
  });

  assertEquals(resEntradas.isSuccess, true);
  assertEquals(resEntradas.value.total, 1);
  assertEquals(resEntradas.value.items[0].tipo, 'entrada');
  assertEquals(resEntradas.value.items[0].cantidad, 15);

  // Filtrar producto sin movimientos
  const resVacio = await kardexUseCase.execute({
    productoId: 'prod-sin-movimientos',
    limit: 10,
    offset: 0,
    actor,
  });

  assertEquals(resVacio.isSuccess, true);
  assertEquals(resVacio.value.total, 0);
  assertEquals(resVacio.value.items.length, 0);
});

Deno.test('Kardex (RF-ADM-B10 / RNF-ADM-04): rechaza si el usuario consulta una sucursal fuera de su alcance', async () => {
  const { movRepo, actor } = crearEscenario();

  const mockResolverAlcance = {
    execute: async () => ({
      isSuccess: true,
      isFailure: false,
      value: {
        esGlobal: false,
        permite: (sucursalId: number) => sucursalId === 1,
        sucursalesPermitidas: () => [1],
      },
    }),
  } as any;

  const kardexConAlcance = new ConsultarKardexUseCase(movRepo, mockResolverAlcance);

  // Intenta consultar la sucursal 2 estando solo autorizado en la 1
  const res = await kardexConAlcance.execute({
    sucursalId: 2,
    limit: 10,
    offset: 0,
    actor,
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof SucursalFueraDeAlcanceError, true);
});

Deno.test('Kardex (RF-ADM-B10 / RNF-ADM-04): acota a las sucursales asignadas si no se especifica sucursalId', async () => {
  const { movRepo, entradaUseCase, actor } = crearEscenario();

  // Movimiento en sucursal 1
  await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    cantidad: 10,
    actor,
  });

  // Movimiento en sucursal 2
  await entradaUseCase.execute({
    productoId: 'prod-1',
    sucursalId: 2,
    cantidad: 30,
    actor,
  });

  // Usuario acotado solo a sucursal 1
  const mockResolverAlcance = {
    execute: async () => ({
      isSuccess: true,
      isFailure: false,
      value: {
        esGlobal: false,
        permite: (sucursalId: number) => sucursalId === 1,
        sucursalesPermitidas: () => [1],
      },
    }),
  } as any;

  const kardexConAlcance = new ConsultarKardexUseCase(movRepo, mockResolverAlcance);

  const res = await kardexConAlcance.execute({
    limit: 10,
    offset: 0,
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.total, 1);
  assertEquals(res.value.items[0].sucursalId, 1);
  assertEquals(res.value.items[0].cantidad, 10);
});


