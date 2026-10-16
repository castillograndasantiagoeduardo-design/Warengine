import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import {
  TransferirMercanciaUseCase,
  TransferirMercanciaRequest,
} from '../../src/modules/inventario/application/use-cases/TransferirMercanciaUseCase.ts';
import {
  DatosAnulacionEntrada,
  DatosRegistroAjuste,
  DatosRegistroEntrada,
  DatosRegistroSalida,
  DatosTransferenciaMercancia,
  FiltrosKardex,
  IMovimientoInventarioRepository,
  ItemKardex,
  MovimientoInventario,
  ResultadoTransferenciaMercancia,
} from '../../src/modules/inventario/domain/repositories/IMovimientoInventarioRepository.ts';
import { IProductoRepository } from '../../src/modules/inventario/domain/repositories/IProductoRepository.ts';
import { ISucursalRepository } from '../../src/modules/administracion/domain/repositories/ISucursalRepository.ts';
import { IAuditor } from '../../src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ActorAuditoria } from '../../src/modules/auditoria/domain/entities/LogAuditoria.ts';
import {
  CantidadInvalidaError,
  ProductoInactivoError,
  ProductoNoEncontradoError,
  StockInsuficienteError,
  SucursalesTransferenciaIgualesError,
} from '../../src/modules/inventario/domain/errors/InventarioErrors.ts';
import {
  SucursalInactivaError,
  SucursalNoEncontradaError,
} from '../../src/modules/administracion/domain/errors/AdministracionErrors.ts';
import { SucursalFueraDeAlcanceError } from '../../src/modules/autenticacion/domain/errors/AlcanceErrors.ts';
import { Producto } from '../../src/modules/inventario/domain/entities/Producto.ts';
import { Sucursal } from '../../src/modules/administracion/domain/entities/Sucursal.ts';

class FakeMovimientoInventarioRepository implements IMovimientoInventarioRepository {
  public stock: Map<string, number> = new Map();
  public transferenciasEjecutadas: DatosTransferenciaMercancia[] = [];

  private key(productoId: string, sucursalId: number): string {
    return `${productoId}__${sucursalId}`;
  }

  public setStock(productoId: string, sucursalId: number, cant: number) {
    this.stock.set(this.key(productoId, sucursalId), cant);
  }

  public obtenerStockActual(productoId: string, sucursalId: number): Promise<number> {
    return Promise.resolve(this.stock.get(this.key(productoId, sucursalId)) ?? 0);
  }

  public transferirMercancia(datos: DatosTransferenciaMercancia): Promise<ResultadoTransferenciaMercancia> {
    this.transferenciasEjecutadas.push(datos);

    const kOrigen = this.key(datos.productoId, datos.sucursalOrigenId);
    const kDestino = this.key(datos.productoId, datos.sucursalDestinoId);
    const actualOrigen = this.stock.get(kOrigen) ?? 0;
    const actualDestino = this.stock.get(kDestino) ?? 0;

    if (actualOrigen < datos.cantidad) {
      throw new StockInsuficienteError(actualOrigen, datos.cantidad);
    }

    const restanteOrigen = actualOrigen - datos.cantidad;
    const resultanteDestino = actualDestino + datos.cantidad;

    this.stock.set(kOrigen, restanteOrigen);
    this.stock.set(kDestino, resultanteDestino);

    return Promise.resolve({
      movimientoSalidaId: 'mov-salida-uuid-1',
      movimientoEntradaId: 'mov-entrada-uuid-2',
      productoId: datos.productoId,
      sucursalOrigenId: datos.sucursalOrigenId,
      sucursalDestinoId: datos.sucursalDestinoId,
      cantidad: datos.cantidad,
      stockRestanteOrigen: restanteOrigen,
      stockResultanteDestino: resultanteDestino,
      fecha: new Date('2026-10-16T12:00:00Z'),
    });
  }

  public registrarEntrada(_datos: DatosRegistroEntrada): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }
  public registrarSalida(_datos: DatosRegistroSalida): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }
  public registrarAjuste(_datos: DatosRegistroAjuste): Promise<MovimientoInventario> {
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

function crearAlcanceMock(esGlobal = true, sucursalesPermitidas = [1, 2]) {
  return {
    execute: async () => ({
      isSuccess: true,
      isFailure: false,
      value: {
        esGlobal,
        sucursales: sucursalesPermitidas,
        permite: (id: number) => esGlobal || sucursalesPermitidas.includes(id),
      },
    }),
  } as any;
}

const PRODUCTO_UUID = '11111111-1111-4111-8111-111111111111';

function crearProducto(id: string, activo: boolean = true): Producto {
  return new Producto(
    id,
    'SKU-TLD-750W',
    'Taladro Percutor 750W',
    1,
    1,
    120000,
    180000,
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

Deno.test('TransferirMercanciaUseCase (RF-ADM-B18)', async (t) => {
  let movRepo: FakeMovimientoInventarioRepository;
  let prodRepo: FakeProductoRepository;
  let sucRepo: FakeSucursalRepository;
  let auditor: FakeAuditor;

  const reset = () => {
    movRepo = new FakeMovimientoInventarioRepository();
    prodRepo = new FakeProductoRepository();
    sucRepo = new FakeSucursalRepository();
    auditor = new FakeAuditor();

    prodRepo.productos.set(PRODUCTO_UUID, crearProducto(PRODUCTO_UUID));
    sucRepo.sucursales.set(1, crearSucursal(1));
    sucRepo.sucursales.set(2, crearSucursal(2));
    movRepo.setStock(PRODUCTO_UUID, 1, 50);
    movRepo.setStock(PRODUCTO_UUID, 2, 10);
  };

  await t.step('falla si sucursal origen y destino son idénticas', async () => {
    reset();
    const useCase = new TransferirMercanciaUseCase(
      movRepo,
      prodRepo as any,
      sucRepo as any,
      auditor,
      crearAlcanceMock(true),
    );

    const result = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 1,
      cantidad: 5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });

    assertEquals(result.isFailure, true);
    assertInstanceOf(result.error, SucursalesTransferenciaIgualesError);
    assertEquals(result.error.code, 'SUCURSALES_TRANSFERENCIA_IGUALES');
  });

  await t.step('falla si la cantidad es menor o igual a cero o no entera', async () => {
    reset();
    const useCase = new TransferirMercanciaUseCase(
      movRepo,
      prodRepo as any,
      sucRepo as any,
      auditor,
      crearAlcanceMock(true),
    );

    const resCero = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      cantidad: 0,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });
    assertEquals(resCero.isFailure, true);
    assertInstanceOf(resCero.error, CantidadInvalidaError);

    const resDecimal = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      cantidad: 3.5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });
    assertEquals(resDecimal.isFailure, true);
    assertInstanceOf(resDecimal.error, CantidadInvalidaError);
  });

  await t.step('falla si la sucursal origen está fuera de alcance (RNF-ADM-04)', async () => {
    reset();
    // Alcance limitado sólo a sucursal 2
    const useCase = new TransferirMercanciaUseCase(
      movRepo,
      prodRepo as any,
      sucRepo as any,
      auditor,
      crearAlcanceMock(false, [2]),
    );

    const result = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1, // Usuario intenta transferir desde sucursal 1 sin permiso
      sucursalDestinoId: 2,
      cantidad: 5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });

    assertEquals(result.isFailure, true);
    assertInstanceOf(result.error, SucursalFueraDeAlcanceError);
  });

  await t.step('falla si el producto no existe o está inactivo', async () => {
    reset();
    const useCase = new TransferirMercanciaUseCase(
      movRepo,
      prodRepo as any,
      sucRepo as any,
      auditor,
      crearAlcanceMock(true),
    );

    const resNoExiste = await useCase.execute({
      productoId: '99999999-9999-4999-8999-999999999999',
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      cantidad: 5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });
    assertEquals(resNoExiste.isFailure, true);
    assertInstanceOf(resNoExiste.error, ProductoNoEncontradoError);

    prodRepo.productos.set(PRODUCTO_UUID, crearProducto(PRODUCTO_UUID, false));
    const resInactivo = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      cantidad: 5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });
    assertEquals(resInactivo.isFailure, true);
    assertInstanceOf(resInactivo.error, ProductoInactivoError);
  });

  await t.step('falla si la sucursal de origen no existe o está inactiva', async () => {
    reset();
    const useCase = new TransferirMercanciaUseCase(
      movRepo,
      prodRepo as any,
      sucRepo as any,
      auditor,
      crearAlcanceMock(true),
    );

    const resNoExiste = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 99,
      sucursalDestinoId: 2,
      cantidad: 5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });
    assertEquals(resNoExiste.isFailure, true);
    assertInstanceOf(resNoExiste.error, SucursalNoEncontradaError);

    sucRepo.sucursales.set(1, crearSucursal(1, false));
    const resInactiva = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      cantidad: 5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });
    assertEquals(resInactiva.isFailure, true);
    assertInstanceOf(resInactiva.error, SucursalInactivaError);
  });

  await t.step('falla si la sucursal de destino no existe o está inactiva', async () => {
    reset();
    const useCase = new TransferirMercanciaUseCase(
      movRepo,
      prodRepo as any,
      sucRepo as any,
      auditor,
      crearAlcanceMock(true),
    );

    const resNoExiste = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 99,
      cantidad: 5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });
    assertEquals(resNoExiste.isFailure, true);
    assertInstanceOf(resNoExiste.error, SucursalNoEncontradaError);

    sucRepo.sucursales.set(2, crearSucursal(2, false));
    const resInactiva = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      cantidad: 5,
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });
    assertEquals(resInactiva.isFailure, true);
    assertInstanceOf(resInactiva.error, SucursalInactivaError);
  });

  await t.step('falla si el stock en la sucursal de origen es insuficiente', async () => {
    reset();
    movRepo.setStock(PRODUCTO_UUID, 1, 10);
    const useCase = new TransferirMercanciaUseCase(
      movRepo,
      prodRepo as any,
      sucRepo as any,
      auditor,
      crearAlcanceMock(true),
    );

    const result = await useCase.execute({
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      cantidad: 15, // Mayor a 10
      actor: { usuarioId: 'usr-1', ip: '127.0.0.1' },
    });

    assertEquals(result.isFailure, true);
    assertInstanceOf(result.error, StockInsuficienteError);
  });

  await t.step('ejecuta exitosamente la transferencia y registra auditoría', async () => {
    reset();
    const useCase = new TransferirMercanciaUseCase(
      movRepo,
      prodRepo as any,
      sucRepo as any,
      auditor,
      crearAlcanceMock(true),
    );

    const req: TransferirMercanciaRequest = {
      productoId: PRODUCTO_UUID,
      sucursalOrigenId: 1,
      sucursalDestinoId: 2,
      cantidad: 12,
      motivo: 'Abastecimiento fin de semana',
      actor: { usuarioId: 'admin-uuid', ip: '192.168.1.100' },
    };

    const result = await useCase.execute(req);

    assertEquals(result.isSuccess, true);
    const response = result.value;
    assertEquals(response.cantidad, 12);
    assertEquals(response.stockRestanteOrigen, 38); // 50 - 12
    assertEquals(response.stockResultanteDestino, 22); // 10 + 12
    assertEquals(response.movimientoSalidaId, 'mov-salida-uuid-1');
    assertEquals(response.movimientoEntradaId, 'mov-entrada-uuid-2');

    // Verificar llamada al repositorio
    assertEquals(movRepo.transferenciasEjecutadas.length, 1);
    assertEquals(movRepo.transferenciasEjecutadas[0].cantidad, 12);
    assertEquals(movRepo.transferenciasEjecutadas[0].motivo, 'Abastecimiento fin de semana');

    // Verificar registro de auditoría (RNF-ADM-02)
    assertEquals(auditor.registros.length, 1);
    const audit = auditor.registros[0];
    assertEquals(audit.accion, 'transferir_mercancia');
    assertEquals(audit.entidad, 'inventario_sucursal');
    assertEquals(audit.entidadId, '1->2:' + PRODUCTO_UUID);
    assertEquals(audit.actor.usuarioId, 'admin-uuid');
    assertEquals(audit.detalles.cantidad, 12);
    assertEquals(audit.detalles.stockRestanteOrigen, 38);
    assertEquals(audit.detalles.stockResultanteDestino, 22);
  });
});
