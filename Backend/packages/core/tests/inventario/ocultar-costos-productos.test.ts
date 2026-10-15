import { assertEquals } from 'jsr:@std/assert';
import { ObtenerProductoPorIdUseCase } from '../../src/modules/inventario/application/use-cases/ObtenerProductoPorIdUseCase.ts';
import { ListarProductosUseCase } from '../../src/modules/inventario/application/use-cases/ListarProductosUseCase.ts';
import { Producto } from '../../src/modules/inventario/domain/entities/Producto.ts';
import {
  DatosActualizarProducto,
  DatosCrearProducto,
  FiltrosListarProductos,
  IProductoRepository,
} from '../../src/modules/inventario/domain/repositories/IProductoRepository.ts';
import { ResultadoPaginado } from '@warengine/shared-kernel';
import { PERMISSIONS } from '@warengine/contracts';

class FakeProductoRepository implements IProductoRepository {
  public productos: Producto[] = [];

  public listar(params: FiltrosListarProductos): Promise<ResultadoPaginado<Producto>> {
    const total = this.productos.length;
    const page = params.page ?? 1;
    const limit = params.limit ?? 50;
    const totalPages = Math.ceil(total / limit) || 1;
    return Promise.resolve({
      items: this.productos,
      total,
      page,
      limit,
      totalPages,
    });
  }

  public findById(id: string): Promise<Producto | null> {
    return Promise.resolve(this.productos.find((p) => p.id === id) ?? null);
  }

  public findBySku(sku: string): Promise<Producto | null> {
    return Promise.resolve(this.productos.find((p) => p.sku === sku) ?? null);
  }

  public crear(datos: DatosCrearProducto): Promise<Producto> {
    const nuevo = new Producto(
      datos.id ?? 'prod-1',
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

  public actualizar(_id: string, _cambios: DatosActualizarProducto): Promise<Producto> {
    throw new Error('No implementado');
  }

  public cambiarEstado(_id: string, _isActive: boolean): Promise<Producto> {
    throw new Error('No implementado');
  }

  public existeSku(_sku: string, _excluirId?: string): Promise<boolean> {
    return Promise.resolve(false);
  }

  public tieneMovimientos(_id: string): Promise<boolean> {
    return Promise.resolve(false);
  }
}

Deno.test('Ocultar costos: cajero NO recibe precioCompra ni proveedorId en obtenerProductoPorId', async () => {
  const repo = new FakeProductoRepository();
  const producto = await repo.crear({
    sku: 'SKU-001',
    nombre: 'Café Especial 500g',
    precioCompra: 12000,
    precioVenta: 18000,
    proveedorId: 10,
    categoriaId: 2,
  });

  const useCase = new ObtenerProductoPorIdUseCase(repo);
  const actorCajero = {
    usuarioId: 'cajero-1',
    ip: '127.0.0.1',
    permisos: [
      PERMISSIONS.INVENTARIO_LEER,
      PERMISSIONS.FACTURACION_FACTURAR,
      PERMISSIONS.FACTURACION_ABRIR_TURNO,
    ],
  };

  const res = await useCase.execute({ id: producto.id, actor: actorCajero });

  assertEquals(res.isSuccess, true);
  assertEquals('precioCompra' in res.value, false);
  assertEquals(res.value.precioCompra, undefined);
  assertEquals('proveedorId' in res.value, false);
  assertEquals(res.value.proveedorId, undefined);
  assertEquals(res.value.precioVenta, 18000);
  assertEquals(res.value.nombre, 'Café Especial 500g');
});

Deno.test('Ocultar costos: vendedor-b2b NO recibe precioCompra ni proveedorId en obtenerProductoPorId', async () => {
  const repo = new FakeProductoRepository();
  const producto = await repo.crear({
    sku: 'SKU-002',
    nombre: 'Azúcar Morena 1kg',
    precioCompra: 3000,
    precioVenta: 4500,
    proveedorId: 12,
  });

  const useCase = new ObtenerProductoPorIdUseCase(repo);
  const actorVendedorB2B = {
    usuarioId: 'vendedor-1',
    ip: '127.0.0.1',
    permisos: [
      PERMISSIONS.INVENTARIO_LEER,
      PERMISSIONS.FACTURACION_FACTURAR,
      PERMISSIONS.FACTURACION_VENDER_B2B,
    ],
  };

  const res = await useCase.execute({ id: producto.id, actor: actorVendedorB2B });

  assertEquals(res.isSuccess, true);
  assertEquals('precioCompra' in res.value, false);
  assertEquals(res.value.precioCompra, undefined);
  assertEquals('proveedorId' in res.value, false);
  assertEquals(res.value.proveedorId, undefined);
  assertEquals(res.value.precioVenta, 4500);
});

Deno.test('Ocultar costos: admin-sucursal SÍ recibe precioCompra y proveedorId en obtenerProductoPorId', async () => {
  const repo = new FakeProductoRepository();
  const producto = await repo.crear({
    sku: 'SKU-003',
    nombre: 'Aceite de Oliva 500ml',
    precioCompra: 25000,
    precioVenta: 35000,
    proveedorId: 15,
  });

  const useCase = new ObtenerProductoPorIdUseCase(repo);
  const actorAdmin = {
    usuarioId: 'admin-1',
    ip: '127.0.0.1',
    permisos: [
      PERMISSIONS.INVENTARIO_LEER,
      PERMISSIONS.INVENTARIO_ESCRIBIR,
    ],
  };

  const res = await useCase.execute({ id: producto.id, actor: actorAdmin });

  assertEquals(res.isSuccess, true);
  assertEquals('precioCompra' in res.value, true);
  assertEquals(res.value.precioCompra, 25000);
  assertEquals('proveedorId' in res.value, true);
  assertEquals(res.value.proveedorId, 15);
  assertEquals(res.value.precioVenta, 35000);
});

Deno.test('Ocultar costos: listarProductos oculta costos a cajero y los muestra a admin-sucursal', async () => {
  const repo = new FakeProductoRepository();
  await repo.crear({
    sku: 'SKU-A',
    nombre: 'Producto A',
    precioCompra: 1000,
    precioVenta: 1500,
    proveedorId: 1,
  });
  await repo.crear({
    sku: 'SKU-B',
    nombre: 'Producto B',
    precioCompra: 2000,
    precioVenta: 3000,
    proveedorId: 2,
  });

  const useCase = new ListarProductosUseCase(repo);

  // Consulta por Cajero (sin inventario:escribir)
  const resCajero = await useCase.execute({
    page: 1,
    limit: 10,
    actor: {
      usuarioId: 'cajero-1',
      ip: '127.0.0.1',
      permisos: [PERMISSIONS.INVENTARIO_LEER, PERMISSIONS.FACTURACION_FACTURAR],
    },
  });

  assertEquals(resCajero.isSuccess, true);
  assertEquals(resCajero.value.items.length, 2);
  for (const item of resCajero.value.items) {
    assertEquals('precioCompra' in item, false);
    assertEquals(item.precioCompra, undefined);
    assertEquals('proveedorId' in item, false);
    assertEquals(item.proveedorId, undefined);
  }

  // Consulta por Admin Sucursal (con inventario:escribir)
  const resAdmin = await useCase.execute({
    page: 1,
    limit: 10,
    actor: {
      usuarioId: 'admin-1',
      ip: '127.0.0.1',
      permisos: [PERMISSIONS.INVENTARIO_LEER, PERMISSIONS.INVENTARIO_ESCRIBIR],
    },
  });

  assertEquals(resAdmin.isSuccess, true);
  assertEquals(resAdmin.value.items.length, 2);
  for (const item of resAdmin.value.items) {
    assertEquals('precioCompra' in item, true);
    assertEquals(typeof item.precioCompra, 'number');
    assertEquals('proveedorId' in item, true);
    assertEquals(typeof item.proveedorId, 'number');
  }
});
