import { assertEquals } from 'jsr:@std/assert';
import {
  ActorAuditoria,
  ConfigurarStockMinimoUseCase,
  ConsultarStockSucursalUseCase,
  DatosDetalleStockSucursal,
  IAuditor,
  IInventarioSucursalRepository,
  InventarioSucursal,
  IProductoRepository,
  ISucursalRepository,
  Producto,
  ProductoInactivoError,
  ProductoNoEncontradoError,
  StockMinimoInvalidoError,
  Sucursal,
  SucursalFueraDeAlcanceError,
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../mod.ts';

// ─── Repositorios InMemory ──────────────────────────────────────────────────

class InMemoryInventarioSucursalRepository implements IInventarioSucursalRepository {
  public inventario: Map<string, { stockActual: number; stockMinimo: number }> = new Map();

  private key(productoId: string, sucursalId: number): string {
    return `${productoId}__${sucursalId}`;
  }

  public setExistencias(productoId: string, sucursalId: number, stockActual: number, stockMinimo: number) {
    this.inventario.set(this.key(productoId, sucursalId), { stockActual, stockMinimo });
  }

  public async obtener(productoId: string, sucursalId: number): Promise<InventarioSucursal | null> {
    const data = this.inventario.get(this.key(productoId, sucursalId));
    if (!data) return null;
    return new InventarioSucursal(productoId, sucursalId, data.stockActual, data.stockMinimo);
  }

  public async obtenerDetalle(
    productoId: string,
    sucursalId: number,
  ): Promise<DatosDetalleStockSucursal | null> {
    const data = this.inventario.get(this.key(productoId, sucursalId));
    if (!data) return null;
    return {
      productoId,
      nombreProducto: 'Producto Test',
      sku: 'SKU-001',
      sucursalId,
      nombreSucursal: 'Sede Central',
      stockActual: data.stockActual,
      stockMinimo: data.stockMinimo,
      alertaAbastecimiento: data.stockActual <= data.stockMinimo,
    };
  }

  public async establecerStockMinimo(
    productoId: string,
    sucursalId: number,
    stockMinimo: number,
  ): Promise<InventarioSucursal> {
    const k = this.key(productoId, sucursalId);
    const actual = this.inventario.get(k)?.stockActual ?? 0;
    this.inventario.set(k, { stockActual: actual, stockMinimo });
    return new InventarioSucursal(productoId, sucursalId, actual, stockMinimo);
  }
}

class InMemoryProductoRepository implements Partial<IProductoRepository> {
  public productos: Map<string, Producto> = new Map();

  public add(p: Producto) {
    this.productos.set(p.id, p);
  }

  public async findById(id: string): Promise<Producto | null> {
    return this.productos.get(id) ?? null;
  }
}

class InMemorySucursalRepository implements Partial<ISucursalRepository> {
  public sucursales: Map<number, Sucursal> = new Map();

  public add(s: Sucursal) {
    this.sucursales.set(s.id, s);
  }

  public async findById(id: number): Promise<Sucursal | null> {
    return this.sucursales.get(id) ?? null;
  }
}

class InMemoryAuditor implements IAuditor {
  public logs: any[] = [];
  public async registrar(log: any): Promise<void> {
    this.logs.push(log);
  }
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const actorSuperAdmin: ActorAuditoria = {
  usuarioId: 'usr-super',
  ip: '127.0.0.1',
};

const actorAdminSucursal: ActorAuditoria = {
  usuarioId: 'usr-admin-suc1',
  ip: '127.0.0.1',
};

function crearProducto(id: string, activo = true): Producto {
  return new Producto(
    id,
    'SKU-TEST',
    'Arroz Diana 1kg',
    1,
    1,
    2000,
    2800,
    2500,
    new Date(),
    activo,
  );
}

function crearSucursal(id: number, activo = true): Sucursal {
  return new Sucursal(
    id,
    `Sucursal ${id}`,
    'Direccion 123',
    '3001234567',
    activo,
  );
}

// ─── Test Suite ─────────────────────────────────────────────────────────────

Deno.test('Stock Mínimo (RF-ADM-B11): configura exitosamente umbral cuando no existía registro previo', async () => {
  const inventarioRepo = new InMemoryInventarioSucursalRepository();
  const productoRepo = new InMemoryProductoRepository();
  const sucursalRepo = new InMemorySucursalRepository();
  const auditor = new InMemoryAuditor();

  productoRepo.add(crearProducto('prod-1', true));
  sucursalRepo.add(crearSucursal(1, true));

  const useCase = new ConfigurarStockMinimoUseCase(
    inventarioRepo,
    productoRepo as any,
    sucursalRepo as any,
    auditor,
  );

  const res = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    stockMinimo: 15,
    actor: actorSuperAdmin,
  });

  assertEquals(res.isSuccess, true);
  const data = res.value;
  assertEquals(data.stockMinimo, 15);
  assertEquals(data.stockActual, 0);
  assertEquals(data.tieneAlertaAbastecimiento, true); // 0 <= 15
  assertEquals(data.faltanteParaMinimo, 15);

  // Verifica auditoría (RNF-ADM-02)
  assertEquals(auditor.logs.length, 1);
  assertEquals(auditor.logs[0].accion, 'editar');
  assertEquals(auditor.logs[0].entidad, 'productos');
  assertEquals(auditor.logs[0].detalles.antes, null);
  assertEquals(auditor.logs[0].detalles.despues.stockMinimo, 15);
});

Deno.test('Stock Mínimo (RF-ADM-B11): actualiza umbral preservando existencias previas', async () => {
  const inventarioRepo = new InMemoryInventarioSucursalRepository();
  const productoRepo = new InMemoryProductoRepository();
  const sucursalRepo = new InMemorySucursalRepository();
  const auditor = new InMemoryAuditor();

  productoRepo.add(crearProducto('prod-1', true));
  sucursalRepo.add(crearSucursal(1, true));
  inventarioRepo.setExistencias('prod-1', 1, 50, 10);

  const useCase = new ConfigurarStockMinimoUseCase(
    inventarioRepo,
    productoRepo as any,
    sucursalRepo as any,
    auditor,
  );

  const res = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    stockMinimo: 20,
    actor: actorSuperAdmin,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.stockMinimo, 20);
  assertEquals(res.value.stockActual, 50);
  assertEquals(res.value.tieneAlertaAbastecimiento, false); // 50 > 20
  assertEquals(res.value.faltanteParaMinimo, 0);

  // Auditoría diferencial
  assertEquals(auditor.logs[0].detalles.antes.stockMinimo, 10);
  assertEquals(auditor.logs[0].detalles.despues.stockMinimo, 20);
});

Deno.test('Stock Mínimo (RF-ADM-B11): rechaza valores negativos o no enteros', async () => {
  const inventarioRepo = new InMemoryInventarioSucursalRepository();
  const productoRepo = new InMemoryProductoRepository();
  const sucursalRepo = new InMemorySucursalRepository();
  const auditor = new InMemoryAuditor();

  const useCase = new ConfigurarStockMinimoUseCase(
    inventarioRepo,
    productoRepo as any,
    sucursalRepo as any,
    auditor,
  );

  const resNegativo = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    stockMinimo: -5,
    actor: actorSuperAdmin,
  });
  assertEquals(resNegativo.isFailure, true);
  assertEquals(resNegativo.error instanceof StockMinimoInvalidoError, true);

  const resDecimal = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    stockMinimo: 10.5,
    actor: actorSuperAdmin,
  });
  assertEquals(resDecimal.isFailure, true);
  assertEquals(resDecimal.error instanceof StockMinimoInvalidoError, true);
});

Deno.test('Stock Mínimo (RF-ADM-B11): rechaza si el producto no existe o está inactivo', async () => {
  const inventarioRepo = new InMemoryInventarioSucursalRepository();
  const productoRepo = new InMemoryProductoRepository();
  const sucursalRepo = new InMemorySucursalRepository();
  const auditor = new InMemoryAuditor();

  sucursalRepo.add(crearSucursal(1, true));
  productoRepo.add(crearProducto('prod-inactivo', false));

  const useCase = new ConfigurarStockMinimoUseCase(
    inventarioRepo,
    productoRepo as any,
    sucursalRepo as any,
    auditor,
  );

  const resNoExiste = await useCase.execute({
    productoId: 'prod-inexistente',
    sucursalId: 1,
    stockMinimo: 10,
    actor: actorSuperAdmin,
  });
  assertEquals(resNoExiste.isFailure, true);
  assertEquals(resNoExiste.error instanceof ProductoNoEncontradoError, true);

  const resInactivo = await useCase.execute({
    productoId: 'prod-inactivo',
    sucursalId: 1,
    stockMinimo: 10,
    actor: actorSuperAdmin,
  });
  assertEquals(resInactivo.isFailure, true);
  assertEquals(resInactivo.error instanceof ProductoInactivoError, true);
});

Deno.test('Stock Mínimo (RF-ADM-B11): rechaza si la sucursal no existe o está inactiva', async () => {
  const inventarioRepo = new InMemoryInventarioSucursalRepository();
  const productoRepo = new InMemoryProductoRepository();
  const sucursalRepo = new InMemorySucursalRepository();
  const auditor = new InMemoryAuditor();

  productoRepo.add(crearProducto('prod-1', true));
  sucursalRepo.add(crearSucursal(2, false));

  const useCase = new ConfigurarStockMinimoUseCase(
    inventarioRepo,
    productoRepo as any,
    sucursalRepo as any,
    auditor,
  );

  const resNoExiste = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 999,
    stockMinimo: 10,
    actor: actorSuperAdmin,
  });
  assertEquals(resNoExiste.isFailure, true);
  assertEquals(resNoExiste.error instanceof SucursalNoEncontradaError, true);

  const resInactiva = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 2,
    stockMinimo: 10,
    actor: actorSuperAdmin,
  });
  assertEquals(resInactiva.isFailure, true);
  assertEquals(resInactiva.error instanceof SucursalInactivaError, true);
});

Deno.test('Stock Mínimo (RF-ADM-B11 / RNF-ADM-04): bloquea si la sucursal está fuera del alcance del usuario', async () => {
  const inventarioRepo = new InMemoryInventarioSucursalRepository();
  const productoRepo = new InMemoryProductoRepository();
  const sucursalRepo = new InMemorySucursalRepository();
  const auditor = new InMemoryAuditor();

  productoRepo.add(crearProducto('prod-1', true));
  sucursalRepo.add(crearSucursal(1, true));
  sucursalRepo.add(crearSucursal(2, true));

  const mockResolverAlcance = {
    execute: async ({ usuarioId }: { usuarioId: string }) => ({
      isSuccess: true,
      isFailure: false,
      value: {
        esGlobal: false,
        permite: (sucursalId: number) => sucursalId === 1,
        sucursalesPermitidas: () => [1],
      },
    }),
  } as any;

  const useCase = new ConfigurarStockMinimoUseCase(
    inventarioRepo,
    productoRepo as any,
    sucursalRepo as any,
    auditor,
    mockResolverAlcance,
  );

  // Intenta configurar stock en sucursal 2 (fuera de alcance)
  const resFuera = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 2,
    stockMinimo: 10,
    actor: actorAdminSucursal,
  });

  assertEquals(resFuera.isFailure, true);
  assertEquals(resFuera.error instanceof SucursalFueraDeAlcanceError, true);

  // Configurar en sucursal 1 (permitida)
  const resPermitida = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    stockMinimo: 10,
    actor: actorAdminSucursal,
  });
  assertEquals(resPermitida.isSuccess, true);
});

Deno.test('Consultar Stock Sucursal (RF-ADM-B11): retorna detalle completo y alerta', async () => {
  const inventarioRepo = new InMemoryInventarioSucursalRepository();
  const productoRepo = new InMemoryProductoRepository();
  const sucursalRepo = new InMemorySucursalRepository();

  productoRepo.add(crearProducto('prod-1', true));
  sucursalRepo.add(crearSucursal(1, true));
  inventarioRepo.setExistencias('prod-1', 1, 5, 20); // 5 <= 20 -> alerta

  const useCase = new ConsultarStockSucursalUseCase(
    inventarioRepo,
    productoRepo as any,
    sucursalRepo as any,
  );

  const res = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 1,
    actor: actorSuperAdmin,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.stockActual, 5);
  assertEquals(res.value.stockMinimo, 20);
  assertEquals(res.value.alertaAbastecimiento, true);
});
