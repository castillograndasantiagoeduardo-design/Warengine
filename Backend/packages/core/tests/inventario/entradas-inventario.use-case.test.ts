import { assertEquals } from 'jsr:@std/assert';
import { ListarEntradasInventarioUseCase } from '../../src/modules/inventario/application/use-cases/ListarEntradasInventarioUseCase.ts';
import { ObtenerEntradaInventarioPorIdUseCase } from '../../src/modules/inventario/application/use-cases/ObtenerEntradaInventarioPorIdUseCase.ts';
import { AnularEntradaInventarioUseCase } from '../../src/modules/inventario/application/use-cases/AnularEntradaInventarioUseCase.ts';
import {
  DatosAnulacionEntrada,
  DatosRegistroEntrada,
  DatosRegistroSalida,
  FiltrosKardex,
  IMovimientoInventarioRepository,
  ItemKardex,
  MovimientoInventario,
} from '../../src/modules/inventario/domain/repositories/IMovimientoInventarioRepository.ts';
import { IAuditor } from '../../src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';
import { SucursalFueraDeAlcanceError } from '../../src/modules/autenticacion/domain/errors/AlcanceErrors.ts';
import { ActorAuditoria } from '../../src/modules/auditoria/domain/entities/LogAuditoria.ts';

class FakeMovimientoInventarioRepository implements IMovimientoInventarioRepository {
  public items: ItemKardex[] = [];
  public stock: Map<string, number> = new Map();

  private key(productoId: string, sucursalId: number): string {
    return `${productoId}__${sucursalId}`;
  }

  public setStock(productoId: string, sucursalId: number, cant: number) {
    this.stock.set(this.key(productoId, sucursalId), cant);
  }

  public obtenerStockActual(productoId: string, sucursalId: number): Promise<number> {
    return Promise.resolve(this.stock.get(this.key(productoId, sucursalId)) ?? 100);
  }

  public registrarEntrada(_datos: DatosRegistroEntrada): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }

  public registrarSalida(_datos: DatosRegistroSalida): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }

  public consultarKardex(filtros: FiltrosKardex): Promise<{ items: ItemKardex[]; total: number }> {
    let filtrados = this.items.filter((item) => {
      if (filtros.tipo && item.tipo !== filtros.tipo) return false;
      if (filtros.productoId && item.productoId !== filtros.productoId) return false;
      if (filtros.proveedorId && item.proveedorId !== filtros.proveedorId) return false;
      if (filtros.sucursalId && item.sucursalId !== filtros.sucursalId) return false;
      if (filtros.sucursalIds && !filtros.sucursalIds.includes(item.sucursalId)) return false;
      return true;
    });

    const total = filtrados.length;
    const paginados = filtrados.slice(filtros.offset, filtros.offset + filtros.limit);
    return Promise.resolve({ items: paginados, total });
  }

  public obtenerPorId(id: string): Promise<ItemKardex | null> {
    const item = this.items.find((i) => i.id === id) ?? null;
    return Promise.resolve(item);
  }

  public estaEntradaAnulada(entradaId: string): Promise<boolean> {
    const anulada = this.items.some(
      (i) => i.tipo === 'salida' && i.motivo?.startsWith(`Anulación de entrada ${entradaId}`),
    );
    return Promise.resolve(anulada);
  }

  public anularEntrada(
    entradaId: string,
    datos: DatosAnulacionEntrada,
  ): Promise<MovimientoInventario> {
    const entrada = this.items.find((i) => i.id === entradaId)!;
    const k = this.key(entrada.productoId, entrada.sucursalId);
    const stockActual = this.stock.get(k) ?? 100;
    const stockResultante = stockActual - entrada.cantidad;
    this.stock.set(k, stockResultante);

    const compensatorio: ItemKardex = {
      id: `anulacion-${entradaId}`,
      productoId: entrada.productoId,
      sucursalId: entrada.sucursalId,
      tipo: 'salida',
      cantidad: entrada.cantidad,
      motivo: `Anulación de entrada ${entradaId}: ${datos.motivo}`,
      proveedorId: entrada.proveedorId,
      usuarioId: datos.usuarioId,
      fecha: new Date(),
    };
    this.items.push(compensatorio);

    return Promise.resolve({
      ...compensatorio,
      stockResultante,
    });
  }
}

class FakeAuditor implements IAuditor {
  public logs: any[] = [];
  public async registrar(log: any): Promise<void> {
    this.logs.push(log);
  }
}

function crearAlcanceMock(esGlobal = true, sucursalesPermitidas = [1]) {
  return {
    execute: async () => ({
      isSuccess: true,
      isFailure: false,
      value: {
        esGlobal,
        permite: (sucursalId: number) => esGlobal || sucursalesPermitidas.includes(sucursalId),
        sucursalesPermitidas: () => (esGlobal ? null : sucursalesPermitidas),
      },
    }),
  } as any;
}

// ─── Tests RF-ADM-B15 ────────────────────────────────────────────────────────

Deno.test('RF-ADM-B15: Listar entradas de mercancía filtradas por proveedor y sucursal', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const resolverAlcance = crearAlcanceMock(true);
  const useCase = new ListarEntradasInventarioUseCase(repo, resolverAlcance);
  const actor: ActorAuditoria = { usuarioId: 'admin-global', ip: '127.0.0.1' };

  repo.items.push(
    {
      id: 'mov-1',
      productoId: 'prod-1',
      productoNombre: 'Arroz 1kg',
      productoSku: 'SKU-ARR-01',
      sucursalId: 1,
      sucursalNombre: 'Sede Norte',
      tipo: 'entrada',
      cantidad: 50,
      proveedorId: 10,
      proveedorNombre: 'Distribuidora Central',
      usuarioId: 'admin-global',
      usuarioNombre: 'Super Administrador',
      fecha: new Date('2026-03-01T10:00:00Z'),
    },
    {
      id: 'mov-2',
      productoId: 'prod-2',
      productoNombre: 'Frijol 500g',
      productoSku: 'SKU-FRI-01',
      sucursalId: 1,
      sucursalNombre: 'Sede Norte',
      tipo: 'entrada',
      cantidad: 30,
      proveedorId: 20,
      proveedorNombre: 'Granos del Valle',
      usuarioId: 'admin-global',
      usuarioNombre: 'Super Administrador',
      fecha: new Date('2026-03-02T11:00:00Z'),
    },
    {
      id: 'mov-3',
      productoId: 'prod-1',
      productoNombre: 'Arroz 1kg',
      productoSku: 'SKU-ARR-01',
      sucursalId: 1,
      sucursalNombre: 'Sede Norte',
      tipo: 'salida',
      cantidad: 5,
      motivo: 'Avería empaque',
      usuarioId: 'admin-global',
      fecha: new Date('2026-03-03T12:00:00Z'),
    },
  );

  const res = await useCase.execute({
    proveedorId: 10,
    sucursalId: 1,
    limit: 10,
    offset: 0,
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.total, 1);
  assertEquals(res.value.items[0].id, 'mov-1');
  assertEquals(res.value.items[0].productoNombre, 'Arroz 1kg');
  assertEquals(res.value.items[0].cantidad, 50);
  assertEquals(res.value.items[0].proveedorNombre, 'Distribuidora Central');
});

Deno.test('RF-ADM-B15 / RNF-ADM-04: Bloquea listado si la sucursal está fuera del alcance del usuario', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const resolverAlcance = crearAlcanceMock(false, [1]);
  const useCase = new ListarEntradasInventarioUseCase(repo, resolverAlcance);
  const actor: ActorAuditoria = { usuarioId: 'admin-sucursal-1', ip: '127.0.0.1' };

  const res = await useCase.execute({
    sucursalId: 2,
    limit: 10,
    offset: 0,
    actor,
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof SucursalFueraDeAlcanceError, true);
});

Deno.test('RF-ADM-B15: Obtener detalle completo de entrada de mercancía por ID', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const resolverAlcance = crearAlcanceMock(true);
  const useCase = new ObtenerEntradaInventarioPorIdUseCase(repo, resolverAlcance);
  const actor: ActorAuditoria = { usuarioId: 'admin-global', ip: '127.0.0.1' };

  repo.items.push({
    id: 'entrada-uuid-123',
    productoId: 'prod-uuid-999',
    productoNombre: 'Aceite de Oliva 500ml',
    productoSku: 'SKU-ACEITE-01',
    sucursalId: 1,
    sucursalNombre: 'Sede Central',
    tipo: 'entrada',
    cantidad: 120,
    motivo: 'Factura Compra FC-8841',
    proveedorId: 15,
    proveedorNombre: 'Aceites y Grasas SAS',
    usuarioId: 'user-01',
    usuarioNombre: 'Carlos Recepcionista',
    fecha: new Date('2026-03-10T14:20:00Z'),
  });

  const res = await useCase.execute({
    id: 'entrada-uuid-123',
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.id, 'entrada-uuid-123');
  assertEquals(res.value.productoNombre, 'Aceite de Oliva 500ml');
  assertEquals(res.value.productoSku, 'SKU-ACEITE-01');
  assertEquals(res.value.cantidad, 120);
  assertEquals(res.value.proveedorNombre, 'Aceites y Grasas SAS');
  assertEquals(res.value.usuarioNombre, 'Carlos Recepcionista');
});

Deno.test('RF-ADM-B15: Falla con 404 si la entrada no existe o no es de tipo entrada', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const resolverAlcance = crearAlcanceMock(true);
  const useCase = new ObtenerEntradaInventarioPorIdUseCase(repo, resolverAlcance);
  const actor: ActorAuditoria = { usuarioId: 'admin-global', ip: '127.0.0.1' };

  repo.items.push({
    id: 'salida-uuid-456',
    productoId: 'prod-uuid-999',
    sucursalId: 1,
    tipo: 'salida',
    cantidad: 10,
    usuarioId: 'user-01',
    fecha: new Date(),
  });

  const res1 = await useCase.execute({ id: 'id-inexistente', actor });
  assertEquals(res1.isSuccess, false);
  assertEquals(res1.error.code, 'ENTRADA_NO_ENCONTRADA');

  const res2 = await useCase.execute({ id: 'salida-uuid-456', actor });
  assertEquals(res2.isSuccess, false);
  assertEquals(res2.error.code, 'ENTRADA_NO_ENCONTRADA');
});

Deno.test('RF-ADM-B15 / RNF-ADM-04: Bloquea detalle de entrada si pertenece a sucursal fuera de alcance', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const resolverAlcance = crearAlcanceMock(false, [1]);
  const useCase = new ObtenerEntradaInventarioPorIdUseCase(repo, resolverAlcance);
  const actor: ActorAuditoria = { usuarioId: 'admin-sucursal-1', ip: '127.0.0.1' };

  repo.items.push({
    id: 'entrada-sucursal-2',
    productoId: 'prod-uuid-999',
    sucursalId: 2,
    tipo: 'entrada',
    cantidad: 50,
    usuarioId: 'user-02',
    fecha: new Date(),
  });

  const res = await useCase.execute({ id: 'entrada-sucursal-2', actor });
  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof SucursalFueraDeAlcanceError, true);
});

// ─── Tests RF-ADM-B16 ────────────────────────────────────────────────────────

Deno.test('RF-ADM-B16: Anular entrada exitosamente revirtiendo existencias y auditando', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const auditor = new FakeAuditor();
  const resolverAlcance = crearAlcanceMock(true);
  const useCase = new AnularEntradaInventarioUseCase(repo, auditor, resolverAlcance);
  const actor: ActorAuditoria = { usuarioId: 'admin-global', ip: '127.0.0.1' };

  repo.items.push({
    id: 'entrada-valida-01',
    productoId: 'prod-1',
    sucursalId: 1,
    tipo: 'entrada',
    cantidad: 40,
    proveedorId: 10,
    usuarioId: 'user-01',
    fecha: new Date(),
  });
  repo.setStock('prod-1', 1, 40);

  const res = await useCase.execute({
    id: 'entrada-valida-01',
    motivo: 'Lote con empaque averiado devuelto al proveedor',
    actor,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.cantidadRevertida, 40);
  assertEquals(res.value.stockResultante, 0);
  assertEquals(auditor.logs.length, 1);
  assertEquals(auditor.logs[0].accion, 'anular');
  assertEquals(auditor.logs[0].entidadId, 'entrada-valida-01');

  // Stock en repo debe haberse descontado
  const stockNuevo = await repo.obtenerStockActual('prod-1', 1);
  assertEquals(stockNuevo, 0);
});

Deno.test('RF-ADM-B16: Rechaza anulación si el motivo está vacío o tiene menos de 5 caracteres', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const auditor = new FakeAuditor();
  const useCase = new AnularEntradaInventarioUseCase(repo, auditor);
  const actor: ActorAuditoria = { usuarioId: 'admin-global', ip: '127.0.0.1' };

  const res = await useCase.execute({
    id: 'entrada-01',
    motivo: ' mal ',
    actor,
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error.code, 'MOTIVO_ANULACION_REQUERIDO');
});

Deno.test('RF-ADM-B16: Rechaza anulación si el stock actual es menor a la cantidad a revertir', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const auditor = new FakeAuditor();
  const useCase = new AnularEntradaInventarioUseCase(repo, auditor);
  const actor: ActorAuditoria = { usuarioId: 'admin-global', ip: '127.0.0.1' };

  repo.items.push({
    id: 'entrada-sin-stock',
    productoId: 'prod-2',
    sucursalId: 1,
    tipo: 'entrada',
    cantidad: 100, // Se ingresaron 100
    usuarioId: 'user-01',
    fecha: new Date(),
  });
  // Pero el stock actual es solo 30 (se vendieron 70)
  repo.setStock('prod-2', 1, 30);

  const res = await useCase.execute({
    id: 'entrada-sin-stock',
    motivo: 'Error de conteo en remisión inicial',
    actor,
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error.code, 'STOCK_INSUFICIENTE');
});

Deno.test('RF-ADM-B16: Rechaza si la entrada ya fue anulada previamente (Idempotencia)', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const auditor = new FakeAuditor();
  const useCase = new AnularEntradaInventarioUseCase(repo, auditor);
  const actor: ActorAuditoria = { usuarioId: 'admin-global', ip: '127.0.0.1' };

  repo.items.push({
    id: 'entrada-ya-anulada',
    productoId: 'prod-3',
    sucursalId: 1,
    tipo: 'entrada',
    cantidad: 20,
    usuarioId: 'user-01',
    fecha: new Date(),
  });
  repo.setStock('prod-3', 1, 20);

  // Primera anulación exitosa
  const res1 = await useCase.execute({
    id: 'entrada-ya-anulada',
    motivo: 'Factura duplicada registrada por error',
    actor,
  });
  assertEquals(res1.isSuccess, true);

  // Segunda anulación debe ser rechazada
  const res2 = await useCase.execute({
    id: 'entrada-ya-anulada',
    motivo: 'Intento de anulación repetida',
    actor,
  });
  assertEquals(res2.isSuccess, false);
  assertEquals(res2.error.code, 'ENTRADA_YA_ANULADA');
});

Deno.test('RF-ADM-B16 / RNF-ADM-04: Bloquea anulación si pertenece a sucursal fuera de alcance', async () => {
  const repo = new FakeMovimientoInventarioRepository();
  const auditor = new FakeAuditor();
  const resolverAlcance = crearAlcanceMock(false, [1]); // Solo sede 1
  const useCase = new AnularEntradaInventarioUseCase(repo, auditor, resolverAlcance);
  const actor: ActorAuditoria = { usuarioId: 'admin-sucursal-1', ip: '127.0.0.1' };

  repo.items.push({
    id: 'entrada-sucursal-2',
    productoId: 'prod-1',
    sucursalId: 2, // Sede 2 fuera de alcance
    tipo: 'entrada',
    cantidad: 15,
    usuarioId: 'user-02',
    fecha: new Date(),
  });

  const res = await useCase.execute({
    id: 'entrada-sucursal-2',
    motivo: 'Anulación indebida en sede ajena',
    actor,
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error instanceof SucursalFueraDeAlcanceError, true);
});
