import { assertEquals } from 'jsr:@std/assert';
import { AjustarInventarioUseCase } from '../../src/modules/inventario/application/use-cases/AjustarInventarioUseCase.ts';
import {
  DatosAnulacionEntrada,
  DatosRegistroAjuste,
  DatosRegistroEntrada,
  DatosRegistroSalida,
  FiltrosKardex,
  IMovimientoInventarioRepository,
  ItemKardex,
  MovimientoInventario,
} from '../../src/modules/inventario/domain/repositories/IMovimientoInventarioRepository.ts';
import { IProductoRepository } from '../../src/modules/inventario/domain/repositories/IProductoRepository.ts';
import { ISucursalRepository } from '../../src/modules/administracion/domain/repositories/ISucursalRepository.ts';
import { IAuditor } from '../../src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';
import { SucursalFueraDeAlcanceError } from '../../src/modules/autenticacion/domain/errors/AlcanceErrors.ts';
import {
  MotivoAjusteRequeridoError,
  ProductoInactivoError,
  ProductoNoEncontradoError,
  StockFisicoInvalidoError,
  StockInsuficienteError,
} from '../../src/modules/inventario/domain/errors/InventarioErrors.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../src/modules/administracion/domain/errors/AdministracionErrors.ts';
import { ActorAuditoria } from '../../src/modules/auditoria/domain/entities/LogAuditoria.ts';
import { Producto } from '../../src/modules/inventario/domain/entities/Producto.ts';
import { Sucursal } from '../../src/modules/administracion/domain/entities/Sucursal.ts';
import { Sku } from '../../src/modules/inventario/domain/value-objects/Sku.ts';

class FakeMovimientoInventarioRepository implements IMovimientoInventarioRepository {
  public stock: Map<string, number> = new Map();
  public ajustesRegistrados: DatosRegistroAjuste[] = [];

  private key(productoId: string, sucursalId: number): string {
    return `${productoId}__${sucursalId}`;
  }

  public setStock(productoId: string, sucursalId: number, cant: number) {
    this.stock.set(this.key(productoId, sucursalId), cant);
  }

  public obtenerStockActual(productoId: string, sucursalId: number): Promise<number> {
    return Promise.resolve(this.stock.get(this.key(productoId, sucursalId)) ?? 0);
  }

  public registrarAjuste(datos: DatosRegistroAjuste): Promise<MovimientoInventario> {
    this.ajustesRegistrados.push(datos);
    const prev = this.stock.get(this.key(datos.productoId, datos.sucursalId)) ?? 0;
    const nuevo = datos.tipo === 'ajuste_entrada' ? prev + datos.cantidad : prev - datos.cantidad;
    this.stock.set(this.key(datos.productoId, datos.sucursalId), nuevo);

    return Promise.resolve({
      id: crypto.randomUUID(),
      productoId: datos.productoId,
      sucursalId: datos.sucursalId,
      tipo: datos.tipo,
      cantidad: datos.cantidad,
      motivo: datos.motivo,
      usuarioId: datos.usuarioId,
      fecha: new Date(),
      stockResultante: nuevo,
    });
  }

  public registrarEntrada(_datos: DatosRegistroEntrada): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }

  public registrarSalida(_datos: DatosRegistroSalida): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }

  public consultarKardex(_filtros: FiltrosKardex): Promise<{ items: ItemKardex[]; total: number }> {
    throw new Error('No implementado');
  }

  public obtenerPorId(_id: string): Promise<ItemKardex | null> {
    throw new Error('No implementado');
  }

  public estaEntradaAnulada(_entradaId: string): Promise<boolean> {
    throw new Error('No implementado');
  }

  public anularEntrada(_entradaId: string, _datos: DatosAnulacionEntrada): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }
}

class FakeProductoRepository implements Partial<IProductoRepository> {
  public productos: Map<string, Producto> = new Map();

  public findById(id: string): Promise<Producto | null> {
    return Promise.resolve(this.productos.get(id) ?? null);
  }
}

class FakeSucursalRepository implements Partial<ISucursalRepository> {
  public sucursales: Map<number, Sucursal> = new Map();

  public findById(id: number): Promise<Sucursal | null> {
    return Promise.resolve(this.sucursales.get(id) ?? null);
  }
}

class FakeAuditor implements IAuditor {
  public registros: any[] = [];
  public registrar(evento: any): Promise<void> {
    this.registros.push(evento);
    return Promise.resolve();
  }
}

function crearActor(id: string = 'user-admin-1'): ActorAuditoria {
  return {
    usuarioId: id,
    ip: '127.0.0.1',
  };
}

function crearProducto(id: string, activo: boolean = true): Producto {
  return new Producto(
    id,
    'SKU-AJUSTE-01',
    'Arroz Diana 1kg',
    1,
    1,
    3500,
    4200,
    null,
    null,
    activo,
  );
}

function crearSucursal(id: number, activo: boolean = true): Sucursal {
  return new Sucursal(
    id,
    `Sucursal ${id}`,
    `Dirección ${id}`,
    '3001234567',
    activo,
  );
}

Deno.test('RF-ADM-B17: Ajuste de entrada exitoso cuando el stock físico es mayor al stock del sistema', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  const prodId = 'prod-123';
  const sucId = 1;
  prodRepo.productos.set(prodId, crearProducto(prodId));
  sucRepo.sucursales.set(sucId, crearSucursal(sucId));
  movRepo.setStock(prodId, sucId, 15); // Sistema: 15

  const useCase = new AjustarInventarioUseCase(movRepo, prodRepo as any, sucRepo as any, auditor);

  // Físico: 20 -> diferencia +5
  const result = await useCase.execute({
    productoId: prodId,
    sucursalId: sucId,
    stockFisico: 20,
    motivo: 'Conteo físico mensual detectó sobrante de 5 unidades',
    actor: crearActor(),
  });

  assertEquals(result.isSuccess, true);
  const data = result.value;
  assertEquals(data.ajusteRealizado, true);
  assertEquals(data.tipoAjuste, 'ajuste_entrada');
  assertEquals(data.stockPrevio, 15);
  assertEquals(data.stockFisico, 20);
  assertEquals(data.diferencia, 5);
  assertEquals(movRepo.ajustesRegistrados.length, 1);
  assertEquals(movRepo.ajustesRegistrados[0].tipo, 'ajuste_entrada');
  assertEquals(movRepo.ajustesRegistrados[0].cantidad, 5);
  assertEquals(auditor.registros.length, 1);
  assertEquals(auditor.registros[0].accion, 'ajustar_stock');
});

Deno.test('RF-ADM-B17: Ajuste de salida exitoso cuando el stock físico es menor al stock del sistema', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  const prodId = 'prod-123';
  const sucId = 1;
  prodRepo.productos.set(prodId, crearProducto(prodId));
  sucRepo.sucursales.set(sucId, crearSucursal(sucId));
  movRepo.setStock(prodId, sucId, 50); // Sistema: 50

  const useCase = new AjustarInventarioUseCase(movRepo, prodRepo as any, sucRepo as any, auditor);

  // Físico: 42 -> diferencia -8
  const result = await useCase.execute({
    productoId: prodId,
    sucursalId: sucId,
    stockFisico: 42,
    motivo: 'Pérdida por deterioro y empaque roto en estantería',
    actor: crearActor(),
  });

  assertEquals(result.isSuccess, true);
  const data = result.value;
  assertEquals(data.ajusteRealizado, true);
  assertEquals(data.tipoAjuste, 'ajuste_salida');
  assertEquals(data.stockPrevio, 50);
  assertEquals(data.stockFisico, 42);
  assertEquals(data.diferencia, -8);
  assertEquals(movRepo.ajustesRegistrados.length, 1);
  assertEquals(movRepo.ajustesRegistrados[0].tipo, 'ajuste_salida');
  assertEquals(movRepo.ajustesRegistrados[0].cantidad, 8);
  assertEquals(auditor.registros.length, 1);
});

Deno.test('RF-ADM-B17: Conteo físico idéntico al stock del sistema no genera movimiento en el Kardex', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  const prodId = 'prod-123';
  const sucId = 1;
  prodRepo.productos.set(prodId, crearProducto(prodId));
  sucRepo.sucursales.set(sucId, crearSucursal(sucId));
  movRepo.setStock(prodId, sucId, 30); // Sistema: 30

  const useCase = new AjustarInventarioUseCase(movRepo, prodRepo as any, sucRepo as any, auditor);

  // Físico: 30 -> diferencia 0
  const result = await useCase.execute({
    productoId: prodId,
    sucursalId: sucId,
    stockFisico: 30,
    motivo: 'Auditoría física de inventario mensual conforme',
    actor: crearActor(),
  });

  assertEquals(result.isSuccess, true);
  const data = result.value;
  assertEquals(data.ajusteRealizado, false);
  assertEquals(data.tipoAjuste, 'sin_cambio');
  assertEquals(data.diferencia, 0);
  assertEquals(data.movimientoId, null);
  assertEquals(movRepo.ajustesRegistrados.length, 0); // No ensucia el kardex
  assertEquals(auditor.registros.length, 1); // Pero sí audita el cuadre
});

Deno.test('RF-ADM-B17: Rechaza ajuste si el motivo es vacío o tiene menos de 5 caracteres', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  const useCase = new AjustarInventarioUseCase(movRepo, prodRepo as any, sucRepo as any, auditor);

  const result1 = await useCase.execute({
    productoId: 'prod-123',
    sucursalId: 1,
    stockFisico: 10,
    motivo: 'abc', // < 5 caracteres
    actor: crearActor(),
  });

  assertEquals(result1.isFailure, true);
  assertEquals(result1.error.code, 'MOTIVO_AJUSTE_REQUERIDO');

  const result2 = await useCase.execute({
    productoId: 'prod-123',
    sucursalId: 1,
    stockFisico: 10,
    motivo: '   ', // vacío
    actor: crearActor(),
  });

  assertEquals(result2.isFailure, true);
  assertEquals(result2.error.code, 'MOTIVO_AJUSTE_REQUERIDO');
});

Deno.test('RF-ADM-B17: Rechaza ajuste si el stock físico es negativo o no entero', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  const useCase = new AjustarInventarioUseCase(movRepo, prodRepo as any, sucRepo as any, auditor);

  const resultNegativo = await useCase.execute({
    productoId: 'prod-123',
    sucursalId: 1,
    stockFisico: -1,
    motivo: 'Conteo físico negativo',
    actor: crearActor(),
  });

  assertEquals(resultNegativo.isFailure, true);
  assertEquals(resultNegativo.error.code, 'STOCK_FISICO_INVALIDO');

  const resultDecimal = await useCase.execute({
    productoId: 'prod-123',
    sucursalId: 1,
    stockFisico: 10.5,
    motivo: 'Conteo con decimales no permitidos',
    actor: crearActor(),
  });

  assertEquals(resultDecimal.isFailure, true);
  assertEquals(resultDecimal.error.code, 'STOCK_FISICO_INVALIDO');
});

Deno.test('RF-ADM-B17: Rechaza ajuste si el producto no existe o está inactivo', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  sucRepo.sucursales.set(1, crearSucursal(1));
  const useCase = new AjustarInventarioUseCase(movRepo, prodRepo as any, sucRepo as any, auditor);

  // Producto inexistente
  const resultInexistente = await useCase.execute({
    productoId: 'prod-inexistente',
    sucursalId: 1,
    stockFisico: 10,
    motivo: 'Conteo físico sobre producto inexistente',
    actor: crearActor(),
  });

  assertEquals(resultInexistente.isFailure, true);
  assertEquals(resultInexistente.error.code, 'PRODUCTO_NO_ENCONTRADO');

  // Producto inactivo
  prodRepo.productos.set('prod-inactivo', crearProducto('prod-inactivo', false));
  const resultInactivo = await useCase.execute({
    productoId: 'prod-inactivo',
    sucursalId: 1,
    stockFisico: 10,
    motivo: 'Conteo físico sobre producto inactivo',
    actor: crearActor(),
  });

  assertEquals(resultInactivo.isFailure, true);
  assertEquals(resultInactivo.error.code, 'PRODUCTO_INACTIVO');
});

Deno.test('RF-ADM-B17: Rechaza ajuste si la sucursal no existe o está inactiva', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  prodRepo.productos.set('prod-1', crearProducto('prod-1'));
  const useCase = new AjustarInventarioUseCase(movRepo, prodRepo as any, sucRepo as any, auditor);

  // Sucursal inexistente
  const resultInexistente = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 999,
    stockFisico: 10,
    motivo: 'Conteo sobre sucursal que no existe',
    actor: crearActor(),
  });

  assertEquals(resultInexistente.isFailure, true);
  assertEquals(resultInexistente.error.code, 'SUCURSAL_NO_ENCONTRADA');

  // Sucursal inactiva
  sucRepo.sucursales.set(2, crearSucursal(2, false));
  const resultInactiva = await useCase.execute({
    productoId: 'prod-1',
    sucursalId: 2,
    stockFisico: 10,
    motivo: 'Conteo sobre sucursal inactiva',
    actor: crearActor(),
  });

  assertEquals(resultInactiva.isFailure, true);
  assertEquals(resultInactiva.error.code, 'SUCURSAL_INACTIVA');
});

Deno.test('RF-ADM-B17 / RNF-ADM-04: Bloquea ajuste si la sucursal está fuera del alcance del usuario', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  const prodId = 'prod-1';
  prodRepo.productos.set(prodId, crearProducto(prodId));
  sucRepo.sucursales.set(2, crearSucursal(2));

  // Resolver alcance mock que solo autoriza sucursal 1 (alcance limitado)
  const mockResolverAlcance = {
    execute: (_req: { usuarioId: string }) => {
      return Promise.resolve({
        isSuccess: true,
        isFailure: false,
        value: {
          permite: (sucursalId: number) => sucursalId === 1,
        },
      });
    },
  };

  const useCase = new AjustarInventarioUseCase(
    movRepo,
    prodRepo as any,
    sucRepo as any,
    auditor,
    mockResolverAlcance as any,
  );

  // Intentar ajustar sucursal 2 estando limitado a sucursal 1
  const result = await useCase.execute({
    productoId: prodId,
    sucursalId: 2,
    stockFisico: 50,
    motivo: 'Ajuste en sucursal no autorizada',
    actor: crearActor('user-limitado'),
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
  assertEquals(movRepo.ajustesRegistrados.length, 0);
});

Deno.test('RF-ADM-B17 / RNF-ADM-04: Super Admin con alcance global puede ajustar cualquier sucursal', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  const prodId = 'prod-global';
  prodRepo.productos.set(prodId, crearProducto(prodId));
  sucRepo.sucursales.set(2, crearSucursal(2));
  movRepo.setStock(prodId, 2, 10);

  // Alcance global
  const mockResolverAlcanceGlobal = {
    execute: (_req: { usuarioId: string }) => {
      return Promise.resolve({
        isSuccess: true,
        isFailure: false,
        value: {
          permite: (_sucursalId: number) => true,
        },
      });
    },
  };

  const useCase = new AjustarInventarioUseCase(
    movRepo,
    prodRepo as any,
    sucRepo as any,
    auditor,
    mockResolverAlcanceGlobal as any,
  );

  const result = await useCase.execute({
    productoId: prodId,
    sucursalId: 2,
    stockFisico: 15,
    motivo: 'Ajuste transversal realizado por superadmin',
    actor: crearActor('user-superadmin'),
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.ajusteRealizado, true);
  assertEquals(result.value.tipoAjuste, 'ajuste_entrada');
  assertEquals(result.value.diferencia, 5);
});

Deno.test('RF-ADM-B17: Propaga error cuando el repositorio rechaza por stock insuficiente', async () => {
  const movRepo = new FakeMovimientoInventarioRepository();
  const prodRepo = new FakeProductoRepository();
  const sucRepo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();

  const prodId = 'prod-fallo';
  prodRepo.productos.set(prodId, crearProducto(prodId));
  sucRepo.sucursales.set(1, crearSucursal(1));
  movRepo.setStock(prodId, 1, 10);

  // Forzar rechazo del repo en ajuste_salida
  movRepo.registrarAjuste = (_datos: DatosRegistroAjuste) => {
    return Promise.reject(new StockInsuficienteError('Stock insuficiente detectado en persistencia'));
  };

  const useCase = new AjustarInventarioUseCase(movRepo, prodRepo as any, sucRepo as any, auditor);

  const result = await useCase.execute({
    productoId: prodId,
    sucursalId: 1,
    stockFisico: 0,
    motivo: 'Descarga total por inventario físico',
    actor: crearActor(),
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'STOCK_INSUFICIENTE');
});
