import { assertEquals } from 'jsr:@std/assert';
import { ConsultarHistorialPreciosUseCase } from '../../src/modules/inventario/application/use-cases/ConsultarHistorialPreciosUseCase.ts';
import { Producto } from '../../src/modules/inventario/domain/entities/Producto.ts';
import {
  DatosActualizarProducto,
  DatosCrearProducto,
  FiltrosListarProductos,
  IProductoRepository,
} from '../../src/modules/inventario/domain/repositories/IProductoRepository.ts';
import {
  EventoAuditoria,
  FiltrosAuditoria,
  IAuditoriaRepository,
  PaginaAuditoria,
} from '../../src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
  LogAuditoria,
} from '../../src/modules/auditoria/domain/entities/LogAuditoria.ts';
import { PERMISSIONS } from '@warengine/contracts';
import { ResultadoPaginado } from '@warengine/shared-kernel';

class InMemoryProductoRepository implements IProductoRepository {
  public productos: Producto[] = [];

  public findById(id: string): Promise<Producto | null> {
    return Promise.resolve(this.productos.find((p) => p.id === id) ?? null);
  }

  public findBySku(sku: string): Promise<Producto | null> {
    return Promise.resolve(this.productos.find((p) => p.sku === sku) ?? null);
  }

  public listar(_params: FiltrosListarProductos): Promise<ResultadoPaginado<Producto>> {
    throw new Error('No implementado');
  }

  public crear(datos: DatosCrearProducto): Promise<Producto> {
    const prod = new Producto(
      datos.id ?? 'prod-123',
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
    this.productos.push(prod);
    return Promise.resolve(prod);
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

class InMemoryAuditoriaRepository implements IAuditoriaRepository {
  public logs: LogAuditoria[] = [];

  public registrar(evento: EventoAuditoria): Promise<void> {
    const log = new LogAuditoria(
      `log-${this.logs.length + 1}`,
      evento.actor.usuarioId,
      'Usuario Auditor',
      evento.accion,
      evento.entidad,
      evento.entidadId ?? null,
      evento.detalles ?? null,
      evento.actor.ip,
      new Date(),
    );
    this.logs.push(log);
    return Promise.resolve();
  }

  public listar(filtros: FiltrosAuditoria): Promise<PaginaAuditoria> {
    let filtrados = this.logs.slice();
    if (filtros.entidad) {
      filtrados = filtrados.filter((l) => l.entidad === filtros.entidad);
    }
    if (filtros.entidadId) {
      filtrados = filtrados.filter((l) => l.entidadId === filtros.entidadId);
    }
    return Promise.resolve({
      items: filtrados,
      total: filtrados.length,
    });
  }
}

Deno.test('RF-ADM-B14: Consultar historial de precios como Admin con cambios de compra y venta', async () => {
  const productoRepo = new InMemoryProductoRepository();
  const auditoriaRepo = new InMemoryAuditoriaRepository();

  const producto = await productoRepo.crear({
    sku: 'SKU-LAPTOP-01',
    nombre: 'Laptop Pro 16',
    precioCompra: 3000000,
    precioVenta: 4200000,
  });

  // Log 1: Creación del producto
  auditoriaRepo.logs.push(
    new LogAuditoria(
      'log-1',
      'user-admin-1',
      'Admin General',
      'crear',
      ENTIDADES_AUDITORIA.PRODUCTOS,
      producto.id,
      {
        cambioPrecio: {
          precioCompra: { antes: null, despues: 3000000 },
          precioVenta: { antes: null, despues: 4200000 },
        },
      },
      '127.0.0.1',
      new Date('2026-01-10T10:00:00Z'),
    ),
  );

  // Log 2: Edición no relacionada con precios (ej. solo nombre) -> debe ignorarse
  auditoriaRepo.logs.push(
    new LogAuditoria(
      'log-2',
      'user-admin-1',
      'Admin General',
      'editar',
      ENTIDADES_AUDITORIA.PRODUCTOS,
      producto.id,
      {
        antes: { nombre: 'Laptop Pro 16' },
        despues: { nombre: 'Laptop Pro 16 (Gris Espacial)' },
      },
      '127.0.0.1',
      new Date('2026-01-12T11:00:00Z'),
    ),
  );

  // Log 3: Actualización de precios
  auditoriaRepo.logs.push(
    new LogAuditoria(
      'log-3',
      'user-admin-2',
      'Gerente Comercial',
      'editar',
      ENTIDADES_AUDITORIA.PRODUCTOS,
      producto.id,
      {
        cambioPrecio: {
          precioCompra: { antes: 3000000, despues: 3200000 },
          precioVenta: { antes: 4200000, despues: 4600000 },
        },
      },
      '127.0.0.1',
      new Date('2026-01-15T15:30:00Z'),
    ),
  );

  const useCase = new ConsultarHistorialPreciosUseCase(productoRepo, auditoriaRepo);
  const actorAdmin: ActorAuditoria = {
    usuarioId: 'user-admin-1',
    ip: '127.0.0.1',
    permisos: [PERMISSIONS.INVENTARIO_LEER, PERMISSIONS.INVENTARIO_ESCRIBIR],
  };

  const res = await useCase.execute({
    productoId: producto.id,
    actor: actorAdmin,
  });

  assertEquals(res.isSuccess, true);
  const data = res.value;
  assertEquals(data.productoId, producto.id);
  assertEquals(data.total, 2); // Solo los 2 logs con cambio de precio

  // Primer registro (creación)
  const itemCreacion = data.items[0];
  assertEquals(itemCreacion.id, 'log-1');
  assertEquals(itemCreacion.precioCompraAnterior, null);
  assertEquals(itemCreacion.precioCompraNuevo, 3000000);
  assertEquals(itemCreacion.precioVentaAnterior, null);
  assertEquals(itemCreacion.precioVentaNuevo, 4200000);

  // Segundo registro (actualización)
  const itemEdicion = data.items[1];
  assertEquals(itemEdicion.id, 'log-3');
  assertEquals(itemEdicion.usuarioNombre, 'Gerente Comercial');
  assertEquals(itemEdicion.precioCompraAnterior, 3000000);
  assertEquals(itemEdicion.precioCompraNuevo, 3200000);
  assertEquals(itemEdicion.precioVentaAnterior, 4200000);
  assertEquals(itemEdicion.precioVentaNuevo, 4600000);
});

Deno.test('RF-ADM-B14: Consultar historial de precios como Cajero OCULTA precios de compra', async () => {
  const productoRepo = new InMemoryProductoRepository();
  const auditoriaRepo = new InMemoryAuditoriaRepository();

  const producto = await productoRepo.crear({
    sku: 'SKU-MOUSE-01',
    nombre: 'Mouse Óptico',
    precioCompra: 20000,
    precioVenta: 35000,
  });

  auditoriaRepo.logs.push(
    new LogAuditoria(
      'log-p1',
      'user-admin-1',
      'Administrador',
      'editar',
      ENTIDADES_AUDITORIA.PRODUCTOS,
      producto.id,
      {
        cambioPrecio: {
          precioCompra: { antes: 20000, despues: 25000 },
          precioVenta: { antes: 35000, despues: 45000 },
        },
      },
      '127.0.0.1',
      new Date(),
    ),
  );

  const useCase = new ConsultarHistorialPreciosUseCase(productoRepo, auditoriaRepo);
  const actorCajero: ActorAuditoria = {
    usuarioId: 'user-cajero-1',
    ip: '127.0.0.1',
    permisos: [PERMISSIONS.INVENTARIO_LEER], // Solo lectura, sin inventario:escribir
  };

  const res = await useCase.execute({
    productoId: producto.id,
    actor: actorCajero,
  });

  assertEquals(res.isSuccess, true);
  const item = res.value.items[0];

  // Precios de compra deben venir en NULL para proteger confidencialidad del costo
  assertEquals(item.precioCompraAnterior, null);
  assertEquals(item.precioCompraNuevo, null);

  // Precios de venta públicos deben ser visibles
  assertEquals(item.precioVentaAnterior, 35000);
  assertEquals(item.precioVentaNuevo, 45000);
});

Deno.test('RF-ADM-B14: Falla si el producto no existe', async () => {
  const productoRepo = new InMemoryProductoRepository();
  const auditoriaRepo = new InMemoryAuditoriaRepository();

  const useCase = new ConsultarHistorialPreciosUseCase(productoRepo, auditoriaRepo);
  const res = await useCase.execute({
    productoId: 'prod-inexistente',
  });

  assertEquals(res.isSuccess, false);
  assertEquals(res.error.code, 'PRODUCTO_NO_ENCONTRADO');
});
