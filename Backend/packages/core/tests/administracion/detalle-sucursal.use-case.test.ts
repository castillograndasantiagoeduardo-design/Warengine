import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  DatosSucursal,
  ISucursalRepository,
  ObtenerDetalleSucursalUseCase,
  Sucursal,
  SucursalDetalle,
  SucursalNoEncontradaError,
} from '../../mod.ts';

class FakeSucursalRepository implements ISucursalRepository {
  public sucursales: Sucursal[] = [];
  public detalles: Map<number, SucursalDetalle> = new Map();

  listar(): Promise<Sucursal[]> {
    return Promise.resolve(this.sucursales);
  }

  findById(id: number): Promise<Sucursal | null> {
    return Promise.resolve(this.sucursales.find((s) => s.id === id) ?? null);
  }

  findByNombre(nombre: string): Promise<Sucursal | null> {
    return Promise.resolve(
      this.sucursales.find((s) => s.nombre.toLowerCase() === nombre.toLowerCase()) ?? null,
    );
  }

  crear(datos: DatosSucursal): Promise<Sucursal> {
    const nueva = new Sucursal(
      this.sucursales.length + 1,
      datos.nombre,
      datos.direccion ?? null,
      datos.contacto ?? null,
      true,
    );
    this.sucursales.push(nueva);
    return Promise.resolve(nueva);
  }

  actualizar(
    id: number,
    cambios: Partial<DatosSucursal> & { isActive?: boolean },
  ): Promise<Sucursal> {
    const idx = this.sucursales.findIndex((s) => s.id === id);
    const actual = this.sucursales[idx];
    const updated = new Sucursal(
      actual.id,
      cambios.nombre ?? actual.nombre,
      cambios.direccion !== undefined ? cambios.direccion : actual.direccion,
      cambios.contacto !== undefined ? cambios.contacto : actual.contacto,
      cambios.isActive !== undefined ? cambios.isActive : actual.isActive,
    );
    this.sucursales[idx] = updated;
    return Promise.resolve(updated);
  }

  async obtenerDetalle(id: number): Promise<SucursalDetalle | null> {
    if (this.detalles.has(id)) {
      return this.detalles.get(id)!;
    }
    const suc = await this.findById(id);
    if (!suc) return null;
    return new SucursalDetalle(
      suc.id,
      suc.nombre,
      suc.direccion,
      suc.contacto,
      suc.isActive,
      [],
      {
        totalUsuariosAsignados: 0,
        productosConStock: 0,
        totalUnidadesStock: 0,
        totalVentas: 0,
        montoTotalVentas: 0,
      },
      [],
    );
  }
}

Deno.test('RF-ADM-C18: ObtenerDetalleSucursalUseCase - Falla si la sucursal no existe', async () => {
  const repo = new FakeSucursalRepository();
  const useCase = new ObtenerDetalleSucursalUseCase(repo);

  const result = await useCase.execute({ id: 999 });

  assertEquals(result.isSuccess, false);
  assertInstanceOf(result.error, SucursalNoEncontradaError);
  assertEquals(result.error.code, 'SUCURSAL_NO_ENCONTRADA');
});

Deno.test('RF-ADM-C18: ObtenerDetalleSucursalUseCase - Retorna detalle consolidado completo', async () => {
  const repo = new FakeSucursalRepository();
  const detalleFixture = new SucursalDetalle(
    2,
    'Sucursal Norte',
    'Calle 100 # 15-20',
    '3001112233',
    true,
    [
      {
        id: 'user-uuid-1',
        email: 'cajero1@warengine.local',
        nombre: 'Carlos Cajero',
        cargo: 'Cajero Principal',
        rolId: 3,
        rolNombre: 'cajero',
        isActive: true,
        esSedePrincipal: true,
      },
      {
        id: 'user-uuid-2',
        email: 'vendedor@warengine.local',
        nombre: 'Valeria Vendedora',
        cargo: 'Vendedor B2B',
        rolId: 4,
        rolNombre: 'vendedor-b2b',
        isActive: true,
        esSedePrincipal: false,
      },
    ],
    {
      totalUsuariosAsignados: 2,
      productosConStock: 15,
      totalUnidadesStock: 120,
      totalVentas: 8,
      montoTotalVentas: 15500000,
    },
    [
      {
        id: 'fact-uuid-1',
        consecutivo: 101,
        fecha: new Date('2026-10-15T10:00:00Z'),
        total: 250000,
        estado: 'emitida',
        clienteNombre: 'Empresa Alpha SAS',
        clienteDocumento: '900123456-1',
      },
    ],
  );

  repo.detalles.set(2, detalleFixture);
  const useCase = new ObtenerDetalleSucursalUseCase(repo);

  const result = await useCase.execute({ id: 2 });

  assertEquals(result.isSuccess, true);
  const data = result.value;
  assertEquals(data.id, 2);
  assertEquals(data.nombre, 'Sucursal Norte');
  assertEquals(data.usuariosAsignados.length, 2);
  assertEquals(data.usuariosAsignados[0].esSedePrincipal, true);
  assertEquals(data.usuariosAsignados[1].esSedePrincipal, false);
  assertEquals(data.estadisticas.productosConStock, 15);
  assertEquals(data.estadisticas.totalUnidadesStock, 120);
  assertEquals(data.estadisticas.totalVentas, 8);
  assertEquals(data.estadisticas.montoTotalVentas, 15500000);
  assertEquals(data.ventasRecientes.length, 1);
  assertEquals(data.ventasRecientes[0].consecutivo, 101);
});

Deno.test('RF-ADM-C18: ObtenerDetalleSucursalUseCase - Retorna valores en cero y listas vacías para sucursal nueva', async () => {
  const repo = new FakeSucursalRepository();
  repo.sucursales.push(
    new Sucursal(3, 'Sucursal Nueva Vacía', 'Av 1 # 2-3', '3100000000', true),
  );
  const useCase = new ObtenerDetalleSucursalUseCase(repo);

  const result = await useCase.execute({ id: 3 });

  assertEquals(result.isSuccess, true);
  const data = result.value;
  assertEquals(data.id, 3);
  assertEquals(data.nombre, 'Sucursal Nueva Vacía');
  assertEquals(data.usuariosAsignados.length, 0);
  assertEquals(data.estadisticas.productosConStock, 0);
  assertEquals(data.estadisticas.totalVentas, 0);
  assertEquals(data.ventasRecientes.length, 0);
});
