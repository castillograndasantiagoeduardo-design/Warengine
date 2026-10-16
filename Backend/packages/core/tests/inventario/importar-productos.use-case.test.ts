import { assertEquals } from 'https://deno.land/std@0.208.0/assert/mod.ts';
import { ImportarProductosUseCase } from '../../src/modules/inventario/application/use-cases/ImportarProductosUseCase.ts';
import {
  DatosActualizarProducto,
  DatosCrearProducto,
  FiltrosListarProductos,
  IProductoRepository,
} from '../../src/modules/inventario/domain/repositories/IProductoRepository.ts';
import {
  ICategoriaRepository,
  DatosCrearCategoria,
  DatosActualizarCategoria,
  FiltrosListarCategorias,
} from '../../src/modules/inventario/domain/repositories/ICategoriaRepository.ts';
import {
  IProveedorRepository,
  DatosCrearProveedor,
  DatosActualizarProveedor,
  FiltrosListarProveedores,
} from '../../src/modules/inventario/domain/repositories/IProveedorRepository.ts';
import { Categoria } from '../../src/modules/inventario/domain/entities/Categoria.ts';
import { Proveedor } from '../../src/modules/inventario/domain/entities/Proveedor.ts';
import { IAuditor } from '../../src/modules/auditoria/domain/repositories/IAuditoriaRepository.ts';
import { Producto } from '../../src/modules/inventario/domain/entities/Producto.ts';
import { ResultadoPaginado } from '@warengine/shared-kernel';

class FakeProductoRepository implements IProductoRepository {
  public productos: Producto[] = [];
  private seq = 1;

  public findById(id: string): Promise<Producto | null> {
    return Promise.resolve(this.productos.find((p) => p.id === id) ?? null);
  }

  public findBySku(sku: string): Promise<Producto | null> {
    const s = sku.trim().toLowerCase();
    return Promise.resolve(this.productos.find((p) => p.sku.toLowerCase() === s) ?? null);
  }

  public crear(datos: DatosCrearProducto): Promise<Producto> {
    const p = new Producto(
      datos.id ?? `prod-${this.seq++}`,
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
    this.productos.push(p);
    return Promise.resolve(p);
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

  public contarActivosPorCategoria(categoriaId: number): Promise<number> {
    return Promise.resolve(
      this.productos.filter((p) => p.categoriaId === categoriaId && p.isActive).length,
    );
  }

  public contarActivosPorProveedor(proveedorId: number): Promise<number> {
    return Promise.resolve(
      this.productos.filter((p) => p.proveedorId === proveedorId && p.isActive).length,
    );
  }

  public listar(_filtros: FiltrosListarProductos): Promise<ResultadoPaginado<Producto>> {
    throw new Error('No implementado');
  }
}

class FakeCategoriaRepository implements ICategoriaRepository {
  public categorias: Categoria[] = [];

  public findById(id: number): Promise<Categoria | null> {
    return Promise.resolve(this.categorias.find((c) => c.id === id) ?? null);
  }

  public listar(_filtros: FiltrosListarCategorias): Promise<ResultadoPaginado<Categoria>> {
    throw new Error('No implementado');
  }
  public listarActivos(): Promise<Categoria[]> {
    return Promise.resolve(this.categorias.filter((c) => c.isActive));
  }
  public crear(_datos: DatosCrearCategoria): Promise<Categoria> {
    throw new Error('No implementado');
  }
  public actualizar(_id: number, _cambios: DatosActualizarCategoria): Promise<Categoria> {
    throw new Error('No implementado');
  }
  public cambiarEstado(_id: number, _isActive: boolean): Promise<Categoria> {
    throw new Error('No implementado');
  }
}

class FakeProveedorRepository implements IProveedorRepository {
  public proveedores: Proveedor[] = [];

  public findById(id: number): Promise<Proveedor | null> {
    return Promise.resolve(this.proveedores.find((p) => p.id === id) ?? null);
  }

  public listar(_filtros: FiltrosListarProveedores): Promise<ResultadoPaginado<Proveedor>> {
    throw new Error('No implementado');
  }
  public listarActivos(): Promise<Proveedor[]> {
    return Promise.resolve(this.proveedores.filter((p) => p.isActive));
  }
  public crear(_datos: DatosCrearProveedor): Promise<Proveedor> {
    throw new Error('No implementado');
  }
  public actualizar(_id: number, _cambios: DatosActualizarProveedor): Promise<Proveedor> {
    throw new Error('No implementado');
  }
  public cambiarEstado(_id: number, _isActive: boolean): Promise<Proveedor> {
    throw new Error('No implementado');
  }
}

class FakeAuditor implements IAuditor {
  public registros: any[] = [];
  public registrar(evento: any): Promise<void> {
    this.registros.push(evento);
    return Promise.resolve();
  }
}

const ACTOR = { usuarioId: 'usr-admin-1', ip: '127.0.0.1' };

Deno.test('ImportarProductosUseCase (RF-ADM-B20)', async (t) => {
  let prodRepo: FakeProductoRepository;
  let catRepo: FakeCategoriaRepository;
  let provRepo: FakeProveedorRepository;
  let auditor: FakeAuditor;
  let useCase: ImportarProductosUseCase;

  const reset = () => {
    prodRepo = new FakeProductoRepository();
    catRepo = new FakeCategoriaRepository();
    provRepo = new FakeProveedorRepository();
    auditor = new FakeAuditor();

    catRepo.categorias.push(new Categoria(1, 'Herramientas', true));
    catRepo.categorias.push(new Categoria(2, 'Construcción (Inactiva)', false));

    provRepo.proveedores.push(new Proveedor(1, 'Makita Colombia', 'contacto@makita.com', true));
    provRepo.proveedores.push(new Proveedor(2, 'Proveedor Inactivo', 'contacto@inactivo.com', false));

    useCase = new ImportarProductosUseCase(prodRepo, catRepo, provRepo, auditor);
  };

  await t.step('retorna 0 filas si el contenido CSV está vacío', async () => {
    reset();
    const result = await useCase.execute({ csvContenido: '', actor: ACTOR });
    assertEquals(result.isSuccess, true);
    assertEquals(result.value.totalFilas, 0);
    assertEquals(result.value.totalCargados, 0);
    assertEquals(result.value.totalRechazados, 0);
    assertEquals(auditor.registros.length, 0);
  });

  await t.step('importa exitosamente productos válidos y registra auditoría', async () => {
    reset();
    const csv = `sku,nombre,precio_compra,precio_venta,categoria_id,proveedor_id
SKU-001,Taladro Inalámbrico 18V,150000,210000,1,1
SKU-002,Pulidora Angular 4.5",120000,175000,1,1`;

    const result = await useCase.execute({ csvContenido: csv, actor: ACTOR });
    assertEquals(result.isSuccess, true);
    const reporte = result.value;
    assertEquals(reporte.totalFilas, 2);
    assertEquals(reporte.totalCargados, 2);
    assertEquals(reporte.totalRechazados, 0);
    assertEquals(reporte.filas[0].estado, 'cargado');
    assertEquals(reporte.filas[0].sku, 'SKU-001');
    assertEquals(reporte.filas[1].estado, 'cargado');
    assertEquals(reporte.filas[1].sku, 'SKU-002');

    assertEquals(prodRepo.productos.length, 2);
    assertEquals(auditor.registros.length, 1);
    assertEquals(auditor.registros[0].accion, 'importar_masivo');
    assertEquals(auditor.registros[0].detalles.totalCargados, 2);
  });

  await t.step('rechaza filas con SKU duplicado dentro del mismo CSV', async () => {
    reset();
    const csv = `sku,nombre,precioCompra,precioVenta
SKU-REP,Martillo de Uña,20000,30000
SKU-REP,Martillo Repetido,25000,35000`;

    const result = await useCase.execute({ csvContenido: csv, actor: ACTOR });
    assertEquals(result.isSuccess, true);
    const rep = result.value;
    assertEquals(rep.totalCargados, 1);
    assertEquals(rep.totalRechazados, 1);
    assertEquals(rep.filas[0].estado, 'cargado');
    assertEquals(rep.filas[1].estado, 'rechazado');
    assertEquals(rep.filas[1].motivo?.includes('duplicado'), true);
  });

  await t.step('rechaza filas con SKU ya existente en la base de datos', async () => {
    reset();
    await prodRepo.crear({
      sku: 'SKU-EXISTE',
      nombre: 'Destornillador Phillips',
      precioCompra: 5000,
      precioVenta: 9000,
    });

    const csv = `sku,nombre,precioCompra,precioVenta
SKU-EXISTE,Otro Destornillador,6000,10000
SKU-NUEVO,Juego de Llaves Allen,15000,25000`;

    const result = await useCase.execute({ csvContenido: csv, actor: ACTOR });
    assertEquals(result.isSuccess, true);
    const rep = result.value;
    assertEquals(rep.totalCargados, 1);
    assertEquals(rep.totalRechazados, 1);
    assertEquals(rep.filas[0].estado, 'rechazado');
    assertEquals(rep.filas[0].motivo?.includes('Ya existe un producto registrado'), true);
    assertEquals(rep.filas[1].estado, 'cargado');
  });

  await t.step('rechaza filas con precios negativos, cero o no numéricos', async () => {
    reset();
    const csv = `sku,nombre,precioCompra,precioVenta
SKU-PRECIO-1,Metro Cinta Métrica,0,15000
SKU-PRECIO-2,Cinta Aislante,1000,-500
SKU-PRECIO-3,Nivel Torpedo,no_es_numero,25000`;

    const result = await useCase.execute({ csvContenido: csv, actor: ACTOR });
    assertEquals(result.isSuccess, true);
    const rep = result.value;
    assertEquals(rep.totalCargados, 0);
    assertEquals(rep.totalRechazados, 3);
    assertEquals(rep.filas[0].estado, 'rechazado');
    assertEquals(rep.filas[1].estado, 'rechazado');
    assertEquals(rep.filas[2].estado, 'rechazado');
  });

  await t.step('rechaza filas con categoría o proveedor inexistente o inactivo', async () => {
    reset();
    const csv = `sku,nombre,precioCompra,precioVenta,categoriaId,proveedorId
SKU-CAT-NO,Producto Cat Inexistente,10000,15000,999,1
SKU-CAT-INACT,Producto Cat Inactiva,10000,15000,2,1
SKU-PROV-NO,Producto Prov Inexistente,10000,15000,1,999
SKU-PROV-INACT,Producto Prov Inactivo,10000,15000,1,2`;

    const result = await useCase.execute({ csvContenido: csv, actor: ACTOR });
    assertEquals(result.isSuccess, true);
    const rep = result.value;
    assertEquals(rep.totalCargados, 0);
    assertEquals(rep.totalRechazados, 4);
    assertEquals(rep.filas[0].motivo?.includes('categoría con ID 999 no existe'), true);
    assertEquals(rep.filas[1].motivo?.includes('categoría con ID 2 está inactiva'), true);
    assertEquals(rep.filas[2].motivo?.includes('proveedor con ID 999 no existe'), true);
    assertEquals(rep.filas[3].motivo?.includes('proveedor con ID 2 está inactivo'), true);
  });
});
