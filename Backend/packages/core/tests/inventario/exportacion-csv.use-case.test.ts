import { assertEquals, assertStringIncludes } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { ExportarProductosCsvUseCase } from '../../src/modules/inventario/application/use-cases/ExportarProductosCsvUseCase.ts';
import { ExportarKardexCsvUseCase } from '../../src/modules/inventario/application/use-cases/ExportarKardexCsvUseCase.ts';
import { generarCsv, escaparCampoCsv } from '../../src/modules/inventario/application/utils/csv-generator.ts';
import {
  DatosActualizarProducto,
  DatosCrearProducto,
  FiltrosListarProductos,
  IProductoRepository,
} from '../../src/modules/inventario/domain/repositories/IProductoRepository.ts';
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
import { Producto } from '../../src/modules/inventario/domain/entities/Producto.ts';
import { ResultadoPaginado } from '@warengine/shared-kernel';
import { PERMISSIONS } from '@warengine/contracts';
import { ActorAuditoria } from '../../src/modules/auditoria/domain/entities/LogAuditoria.ts';

// ─── FAKES ──────────────────────────────────────────────────────────────────

class FakeProductoRepository implements IProductoRepository {
  public productos: Producto[] = [];

  public findById(id: string): Promise<Producto | null> {
    return Promise.resolve(this.productos.find((p) => p.id === id) ?? null);
  }

  public findBySku(sku: string): Promise<Producto | null> {
    const s = sku.trim().toLowerCase();
    return Promise.resolve(this.productos.find((p) => p.sku.toLowerCase() === s) ?? null);
  }

  public listar(filtros: FiltrosListarProductos): Promise<ResultadoPaginado<Producto>> {
    let items = [...this.productos];

    if (filtros.texto) {
      const q = filtros.texto.toLowerCase();
      items = items.filter(
        (p) => p.nombre.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q),
      );
    }
    if (filtros.categoriaId !== undefined) {
      items = items.filter((p) => p.categoriaId === filtros.categoriaId);
    }
    if (filtros.proveedorId !== undefined) {
      items = items.filter((p) => p.proveedorId === filtros.proveedorId);
    }
    if (filtros.isActive !== undefined) {
      items = items.filter((p) => p.isActive === filtros.isActive);
    }

    const total = items.length;
    const limit = filtros.limit || 50;
    const paginados = items.slice(0, limit);

    return Promise.resolve({
      items: paginados,
      total,
      page: 1,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
    });
  }

  public crear(_datos: DatosCrearProducto): Promise<Producto> {
    throw new Error('No implementado');
  }
  public actualizar(_id: string, _cambios: DatosActualizarProducto): Promise<Producto> {
    throw new Error('No implementado');
  }
  public cambiarEstado(_id: string, _isActive: boolean): Promise<Producto> {
    throw new Error('No implementado');
  }
  public tieneMovimientos(_id: string): Promise<boolean> {
    return Promise.resolve(false);
  }
  public contarActivosPorCategoria(_categoriaId: number): Promise<number> {
    return Promise.resolve(0);
  }
  public contarActivosPorProveedor(_proveedorId: number): Promise<number> {
    return Promise.resolve(0);
  }
}

class FakeMovimientoRepository implements IMovimientoInventarioRepository {
  public items: ItemKardex[] = [];

  public consultarKardex(filtros: FiltrosKardex): Promise<{ items: ItemKardex[]; total: number }> {
    let filtrados = [...this.items];

    if (filtros.productoId) {
      filtrados = filtrados.filter((i) => i.productoId === filtros.productoId);
    }
    if (filtros.sucursalId !== undefined) {
      filtrados = filtrados.filter((i) => i.sucursalId === filtros.sucursalId);
    } else if (filtros.sucursalIds && filtros.sucursalIds.length > 0) {
      filtrados = filtrados.filter((i) => filtros.sucursalIds!.includes(i.sucursalId));
    }
    if (filtros.tipo) {
      filtrados = filtrados.filter((i) => i.tipo === filtros.tipo);
    }

    return Promise.resolve({
      items: filtrados.slice(0, filtros.limit),
      total: filtrados.length,
    });
  }

  public obtenerStockActual(_pId: string, _sId: number): Promise<number> {
    return Promise.resolve(10);
  }
  public registrarEntrada(_d: DatosRegistroEntrada): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }
  public registrarSalida(_d: DatosRegistroSalida): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }
  public registrarAjuste(_d: DatosRegistroAjuste): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }
  public transferirMercancia(_d: DatosTransferenciaMercancia): Promise<ResultadoTransferenciaMercancia> {
    throw new Error('No implementado');
  }
  public obtenerPorId(_id: string): Promise<ItemKardex | null> {
    return Promise.resolve(null);
  }
  public estaEntradaAnulada(_entradaId: string): Promise<boolean> {
    return Promise.resolve(false);
  }
  public anularEntrada(_eId: string, _d: DatosAnulacionEntrada): Promise<MovimientoInventario> {
    throw new Error('No implementado');
  }
}

function crearAlcanceMock(esGlobal = true, sucursalesPermitidas: number[] = [1, 2]) {
  return {
    execute: () =>
      Promise.resolve({
        isSuccess: true,
        isFailure: false,
        value: {
          esGlobal,
          sucursales: sucursalesPermitidas,
          sucursalesPermitidas: () => sucursalesPermitidas,
          permite: (id: number) => esGlobal || sucursalesPermitidas.includes(id),
        },
      }),
  } as any;
}

// ─── TESTS ──────────────────────────────────────────────────────────────────

Deno.test('Generador CSV: RFC 4180 y soporte de comillas/delimitadores', () => {
  assertEquals(escaparCampoCsv('Simple'), 'Simple');
  assertEquals(escaparCampoCsv('Texto con, coma'), '"Texto con, coma"');
  assertEquals(escaparCampoCsv('Con "comillas"'), '"Con ""comillas"""');
  assertEquals(escaparCampoCsv('Salto\nde linea'), '"Salto\nde linea"');

  const headers = ['ID', 'Nombre', 'Precio'];
  const filas = [
    ['1', 'Tornillo 1/2"', 0.5],
    ['2', 'Martillo, pesado', 15.0],
  ];

  const csv = generarCsv(headers, filas, { incluirBom: false });
  assertStringIncludes(csv, 'ID,Nombre,Precio');
  assertStringIncludes(csv, '1,"Tornillo 1/2""",0.5');
  assertStringIncludes(csv, '2,"Martillo, pesado",15');
});

Deno.test('RF-ADM-B21: ExportarProductosCsvUseCase - Admin con costos visibles', async () => {
  const repo = new FakeProductoRepository();
  repo.productos = [
    new Producto('prod-1', 'SKU-001', 'Taladro Percutor', 10, 5, 50.0, 85.0, 75.0, null, true),
    new Producto('prod-2', 'SKU-002', 'Caja de Clavos', 10, null, 2.0, 5.0, null, null, true),
  ];

  const useCase = new ExportarProductosCsvUseCase(repo);

  const actorAdmin: ActorAuditoria = {
    usuarioId: 'admin-1',
    ip: null,
    permisos: [PERMISSIONS.INVENTARIO_LEER, PERMISSIONS.INVENTARIO_ESCRIBIR],
  };

  const resultado = await useCase.execute({
    actor: actorAdmin,
  });

  assertEquals(resultado.isSuccess, true);
  const data = resultado.value;
  assertEquals(data.total, 2);
  assertStringIncludes(data.nombreArchivo, 'productos_');

  // Verifica encabezados de admin (incluyen PrecioCompra y ProveedorID)
  assertStringIncludes(data.csv, 'ID,SKU,Nombre,CategoriaID,ProveedorID,PrecioCompra,PrecioVenta,PrecioCorporativo,Activo');
  assertStringIncludes(data.csv, 'SKU-001,Taladro Percutor,10,5,50.00,85.00,75.00,SI');
  assertStringIncludes(data.csv, 'SKU-002,Caja de Clavos,10,,2.00,5.00,,SI');
});

Deno.test('RF-ADM-B21: ExportarProductosCsvUseCase - Cajero/Vendedor OCULTA costos (RF-FMC-B9 / RF-ADM-B14)', async () => {
  const repo = new FakeProductoRepository();
  repo.productos = [
    new Producto('prod-1', 'SKU-001', 'Taladro Percutor', 10, 5, 50.0, 85.0, 75.0, null, true),
  ];

  const useCase = new ExportarProductosCsvUseCase(repo);

  const actorCajero: ActorAuditoria = {
    usuarioId: 'cajero-1',
    ip: null,
    permisos: [PERMISSIONS.INVENTARIO_LEER], // No tiene inventario:escribir
  };

  const resultado = await useCase.execute({
    actor: actorCajero,
  });

  assertEquals(resultado.isSuccess, true);
  const data = resultado.value;

  // NO debe incluir PrecioCompra ni ProveedorID en los encabezados ni valores
  assertEquals(data.csv.includes('PrecioCompra'), false);
  assertEquals(data.csv.includes('ProveedorID'), false);
  assertEquals(data.csv.includes('50.00'), false); // El costo confidencial no debe figurar
  assertStringIncludes(data.csv, 'ID,SKU,Nombre,CategoriaID,PrecioVenta,PrecioCorporativo,Activo');
  assertStringIncludes(data.csv, 'SKU-001,Taladro Percutor,10,85.00,75.00,SI');
});

Deno.test('RF-ADM-B21: ExportarProductosCsvUseCase - Aplica filtros de búsqueda', async () => {
  const repo = new FakeProductoRepository();
  repo.productos = [
    new Producto('prod-1', 'SKU-HERR-1', 'Taladro', 1, 5, 50.0, 85.0, null, null, true),
    new Producto('prod-2', 'SKU-ELEC-2', 'Bombillo LED', 2, 8, 3.0, 7.0, null, null, true),
  ];

  const useCase = new ExportarProductosCsvUseCase(repo);

  const resultado = await useCase.execute({
    categoriaId: 2,
  });

  assertEquals(resultado.isSuccess, true);
  assertEquals(resultado.value.total, 1);
  assertStringIncludes(resultado.value.csv, 'SKU-ELEC-2');
  assertEquals(resultado.value.csv.includes('SKU-HERR-1'), false);
});

Deno.test('RF-ADM-B21: ExportarKardexCsvUseCase - Exporta movimientos con formato y columnas correctas', async () => {
  const repo = new FakeMovimientoRepository();
  repo.items = [
    {
      id: 'mov-1',
      productoId: 'prod-1',
      productoSku: 'SKU-001',
      productoNombre: 'Taladro',
      sucursalId: 1,
      sucursalNombre: 'Sede Principal',
      tipo: 'entrada',
      cantidad: 20,
      motivo: 'Compra de lote',
      proveedorNombre: 'Ferretería Central',
      usuarioNombre: 'Carlos Admin',
      usuarioId: 'user-1',
      fecha: new Date('2026-10-15T10:00:00Z'),
    },
    {
      id: 'mov-2',
      productoId: 'prod-1',
      productoSku: 'SKU-001',
      productoNombre: 'Taladro',
      sucursalId: 1,
      sucursalNombre: 'Sede Principal',
      tipo: 'salida',
      cantidad: 5,
      motivo: 'Venta mostrador',
      usuarioNombre: 'Ana Cajera',
      usuarioId: 'user-2',
      fecha: new Date('2026-10-15T12:00:00Z'),
    },
  ];

  const useCase = new ExportarKardexCsvUseCase(repo);

  const actor: ActorAuditoria = {
    usuarioId: 'admin-1',
    ip: null,
    permisos: [PERMISSIONS.INVENTARIO_VER_KARDEX],
  };

  const resultado = await useCase.execute({
    actor,
  });

  assertEquals(resultado.isSuccess, true);
  const data = resultado.value;
  assertEquals(data.total, 2);
  assertStringIncludes(data.nombreArchivo, 'kardex_');
  assertStringIncludes(
    data.csv,
    'ID_Movimiento,Fecha,Sucursal,SKU,Producto,Tipo,Cantidad,Motivo,Proveedor,FacturaID,Responsable',
  );
  assertStringIncludes(data.csv, 'mov-1,2026-10-15T10:00:00.000Z,Sede Principal,SKU-001,Taladro,entrada,20,Compra de lote,Ferretería Central,,Carlos Admin');
  assertStringIncludes(data.csv, 'mov-2,2026-10-15T12:00:00.000Z,Sede Principal,SKU-001,Taladro,salida,5,Venta mostrador,,,Ana Cajera');
});

Deno.test('RF-ADM-B21 / RNF-ADM-04: ExportarKardexCsvUseCase - Respeta aislamiento de sede', async () => {
  const repo = new FakeMovimientoRepository();
  repo.items = [
    {
      id: 'mov-1',
      productoId: 'prod-1',
      sucursalId: 1, // Sede Principal
      tipo: 'entrada',
      cantidad: 10,
      usuarioId: 'user-1',
      fecha: new Date(),
    },
    {
      id: 'mov-2',
      productoId: 'prod-1',
      sucursalId: 2, // Sede Norte
      tipo: 'entrada',
      cantidad: 15,
      usuarioId: 'user-2',
      fecha: new Date(),
    },
  ];

  // El usuario 2 solo tiene alcance sobre sucursal 2 (Sede Norte)
  const resolverAlcance = crearAlcanceMock(false, [2]);
  const useCase = new ExportarKardexCsvUseCase(repo, resolverAlcance);

  // Caso A: Intenta exportar de sucursal 1 (fuera de alcance) -> Falla
  const resFuera = await useCase.execute({
    sucursalId: 1,
    actor: {
      usuarioId: 'admin-suc-2',
      ip: null,
      permisos: [PERMISSIONS.INVENTARIO_VER_KARDEX],
    },
  });
  assertEquals(resFuera.isFailure, true);
  assertEquals(resFuera.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');

  // Caso B: Exporta sin especificar sucursal -> Solo exporta movimientos de sucursal 2
  const resPermitido = await useCase.execute({
    actor: {
      usuarioId: 'admin-suc-2',
      ip: null,
      permisos: [PERMISSIONS.INVENTARIO_VER_KARDEX],
    },
  });
  assertEquals(resPermitido.isSuccess, true);
  assertEquals(resPermitido.value.total, 1);
  assertStringIncludes(resPermitido.value.csv, 'mov-2');
  assertEquals(resPermitido.value.csv.includes('mov-1'), false);
});
