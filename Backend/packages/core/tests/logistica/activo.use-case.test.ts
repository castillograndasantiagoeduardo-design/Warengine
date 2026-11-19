import { assertEquals } from 'jsr:@std/assert@^1';
import {
  Activo,
  CategoriaActivo,
  EditarActivoUseCase,
  ListarMantenimientosUseCase,
  IActivoRepository,
  ICategoriaActivoRepository,
  IMantenimientoActivoRepository,
  DatosActualizarActivo,
  DatosCrearActivo,
  FiltrosListarActivos,
  ResultadoPaginado,
  ResumenActivos,
  DatosCrearMantenimiento,
  DatosFinalizarMantenimiento,
  FiltrosListarMantenimientos,
  MantenimientoActivo,
  MantenimientoActivoDetallado,
  ResumenMantenimientos,
  ResolverAlcanceSucursalUseCase,
  IAuditor,
  EventoAuditoria,
  ActorAuditoria,
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
  IUsuarioRepository,
  IRolRepository,
  ISucursalesAutorizadasRepository,
  Usuario,
} from '../../mod.ts';

// Fake repositories
class FakeActivoRepository implements IActivoRepository {
  public activos: Activo[] = [];

  public listar(filtros: FiltrosListarActivos): Promise<ResultadoPaginado<Activo>> {
    let items = [...this.activos];
    if (filtros.sucursalIds && filtros.sucursalIds.length > 0) {
      items = items.filter((a) => filtros.sucursalIds!.includes(a.sucursalId));
    }
    return Promise.resolve({
      items,
      total: items.length,
      page: filtros.page,
      limit: filtros.limit,
      totalPages: 1,
    });
  }

  public findById(id: string): Promise<Activo | null> {
    return Promise.resolve(this.activos.find((a) => a.id === id) ?? null);
  }

  public findByCodigo(codigo: string): Promise<Activo | null> {
    return Promise.resolve(this.activos.find((a) => a.codigoActivo === codigo) ?? null);
  }

  public crear(datos: DatosCrearActivo): Promise<Activo> {
    const a = new Activo(
      crypto.randomUUID(),
      datos.codigoActivo,
      datos.nombre,
      datos.categoriaActivoId,
      'Cat Test',
      datos.sucursalId,
      'disponible',
      datos.valorAdquisicion,
      datos.fechaAdquisicion,
      datos.condicion,
      true,
    );
    this.activos.push(a);
    return Promise.resolve(a);
  }

  public actualizar(id: string, datos: DatosActualizarActivo): Promise<Activo> {
    const idx = this.activos.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Not found');
    const existing = this.activos[idx];
    const updated = new Activo(
      existing.id,
      existing.codigoActivo,
      datos.nombre ?? existing.nombre,
      datos.categoriaActivoId !== undefined ? datos.categoriaActivoId : existing.categoriaActivoId,
      existing.categoriaNombre,
      existing.sucursalId,
      existing.estado,
      datos.valorAdquisicion !== undefined ? datos.valorAdquisicion : existing.valorAdquisicion,
      datos.fechaAdquisicion !== undefined ? datos.fechaAdquisicion : existing.fechaAdquisicion,
      datos.condicion !== undefined ? datos.condicion : existing.condicion,
      existing.isActive,
    );
    this.activos[idx] = updated;
    return Promise.resolve(updated);
  }

  public marcarBaja(id: string): Promise<Activo> {
    const idx = this.activos.findIndex((a) => a.id === id);
    const existing = this.activos[idx];
    const baja = new Activo(
      existing.id,
      existing.codigoActivo,
      existing.nombre,
      existing.categoriaActivoId,
      existing.categoriaNombre,
      existing.sucursalId,
      'baja',
      existing.valorAdquisicion,
      existing.fechaAdquisicion,
      existing.condicion,
      false,
    );
    this.activos[idx] = baja;
    return Promise.resolve(baja);
  }

  public obtenerResumen(sucursalIds?: number[]): Promise<ResumenActivos> {
    let items = [...this.activos];
    if (sucursalIds && sucursalIds.length > 0) {
      items = items.filter((a) => sucursalIds.includes(a.sucursalId));
    }
    return Promise.resolve({
      total: items.length,
      disponibles: items.filter((a) => a.estado === 'disponible').length,
      asignados: items.filter((a) => a.estado === 'asignado').length,
      enMantenimiento: items.filter((a) => a.estado === 'mantenimiento').length,
      deBaja: items.filter((a) => a.estado === 'baja').length,
      valorTotal: items.reduce((acc, a) => acc + (a.valorAdquisicion ?? 0), 0),
    });
  }
}

class FakeCategoriaActivoRepository implements ICategoriaActivoRepository {
  public categorias: CategoriaActivo[] = [];

  public listar(): Promise<ResultadoPaginado<CategoriaActivo>> {
    return Promise.resolve({
      items: this.categorias,
      total: this.categorias.length,
      page: 1,
      limit: 50,
      totalPages: 1,
    });
  }

  public findById(id: number): Promise<CategoriaActivo | null> {
    return Promise.resolve(this.categorias.find((c) => c.id === id) ?? null);
  }

  public findByNombre(nombre: string): Promise<CategoriaActivo | null> {
    return Promise.resolve(this.categorias.find((c) => c.nombre === nombre) ?? null);
  }

  public crear(datos: { nombre: string }): Promise<CategoriaActivo> {
    const cat = new CategoriaActivo(this.categorias.length + 1, datos.nombre, true, 0);
    this.categorias.push(cat);
    return Promise.resolve(cat);
  }

  public actualizar(id: number, cambios: { nombre: string }): Promise<CategoriaActivo> {
    const cat = new CategoriaActivo(id, cambios.nombre, true, 0);
    return Promise.resolve(cat);
  }

  public cambiarEstado(id: number, isActive: boolean): Promise<CategoriaActivo> {
    const c = this.categorias.find((x) => x.id === id)!;
    const updated = new CategoriaActivo(id, c.nombre, isActive, 0);
    return Promise.resolve(updated);
  }
}

class FakeMantenimientoActivoRepository implements IMantenimientoActivoRepository {
  public mantenimientos: MantenimientoActivoDetallado[] = [];

  public crear(datos: DatosCrearMantenimiento): Promise<MantenimientoActivo> {
    const m = new MantenimientoActivo(
      crypto.randomUUID(),
      datos.activoId,
      datos.proveedorId,
      'Prov',
      datos.tipo,
      datos.fecha ?? '2026-11-19',
      null,
      datos.costo,
      datos.descripcion,
    );
    this.mantenimientos.push({
      id: m.id,
      activoId: m.activoId,
      activoCodigo: 'ACT-001',
      activoNombre: 'Laptop Dell',
      sucursalId: 1,
      proveedorId: m.proveedorId,
      proveedorNombre: 'Prov',
      tipo: m.tipo,
      fecha: m.fecha,
      fechaFin: null,
      costo: m.costo,
      descripcion: m.descripcion,
      enCurso: true,
    });
    return Promise.resolve(m);
  }

  public findById(id: string): Promise<MantenimientoActivo | null> {
    const found = this.mantenimientos.find((m) => m.id === id);
    if (!found) return Promise.resolve(null);
    return Promise.resolve(new MantenimientoActivo(
      found.id,
      found.activoId,
      found.proveedorId,
      found.proveedorNombre,
      found.tipo,
      found.fecha,
      found.fechaFin,
      found.costo,
      found.descripcion,
    ));
  }

  public findEnCursoPorActivo(activoId: string): Promise<MantenimientoActivo | null> {
    const found = this.mantenimientos.find((m) => m.activoId === activoId && m.enCurso);
    if (!found) return Promise.resolve(null);
    return Promise.resolve(new MantenimientoActivo(
      found.id,
      found.activoId,
      found.proveedorId,
      found.proveedorNombre,
      found.tipo,
      found.fecha,
      found.fechaFin,
      found.costo,
      found.descripcion,
    ));
  }

  public listarPorActivo(activoId: string): Promise<MantenimientoActivo[]> {
    return Promise.resolve(
      this.mantenimientos
        .filter((m) => m.activoId === activoId)
        .map((f) => new MantenimientoActivo(
          f.id,
          f.activoId,
          f.proveedorId,
          f.proveedorNombre,
          f.tipo,
          f.fecha,
          f.fechaFin,
          f.costo,
          f.descripcion,
        )),
    );
  }

  public finalizar(id: string, datos: DatosFinalizarMantenimiento): Promise<MantenimientoActivo> {
    const idx = this.mantenimientos.findIndex((m) => m.id === id);
    this.mantenimientos[idx].fechaFin = datos.fechaFin;
    this.mantenimientos[idx].enCurso = false;
    const found = this.mantenimientos[idx];
    return Promise.resolve(new MantenimientoActivo(
      found.id,
      found.activoId,
      found.proveedorId,
      found.proveedorNombre,
      found.tipo,
      found.fecha,
      found.fechaFin,
      found.costo,
      found.descripcion,
    ));
  }

  public listarPaginado(filtros: FiltrosListarMantenimientos): Promise<ResultadoPaginado<MantenimientoActivoDetallado>> {
    let items = [...this.mantenimientos];
    if (filtros.sucursalIds && filtros.sucursalIds.length > 0) {
      items = items.filter((m) => filtros.sucursalIds!.includes(m.sucursalId));
    }
    if (filtros.estado === 'en_curso') {
      items = items.filter((m) => m.enCurso);
    } else if (filtros.estado === 'finalizado') {
      items = items.filter((m) => !m.enCurso);
    }
    return Promise.resolve({
      items,
      total: items.length,
      page: filtros.page,
      limit: filtros.limit,
      totalPages: 1,
    });
  }

  public obtenerResumen(sucursalIds?: number[]): Promise<ResumenMantenimientos> {
    let items = [...this.mantenimientos];
    if (sucursalIds && sucursalIds.length > 0) {
      items = items.filter((m) => sucursalIds.includes(m.sucursalId));
    }
    return Promise.resolve({
      total: items.length,
      enCurso: items.filter((m) => m.enCurso).length,
      finalizados: items.filter((m) => !m.enCurso).length,
      vencidos: 0,
    });
  }
}

class FakeAuditor implements IAuditor {
  public eventos: EventoAuditoria[] = [];
  public registrar(evento: EventoAuditoria): Promise<void> {
    this.eventos.push(evento);
    return Promise.resolve();
  }
}

const mockUsuario = new Usuario('usr-1', 'admin@example.com', 'hash', 2, true, false, null);

const mockUsuarioRepo: IUsuarioRepository = {
  findById: () => Promise.resolve(mockUsuario),
  findByEmail: () => Promise.resolve(mockUsuario),
};

const mockRolRepo: IRolRepository = {
  obtenerPermisosDeRol: () => Promise.resolve(['logistica:gestionar-activos', 'logistica:leer']),
};

const mockSucursalesRepo = (ids: number[]): ISucursalesAutorizadasRepository => ({
  obtenerIdsAutorizados: () => Promise.resolve(ids),
});

const actor: ActorAuditoria = {
  usuarioId: 'usr-1',
  ip: '127.0.0.1',
};

Deno.test('EditarActivoUseCase: actualiza campos y registra auditoría', async () => {
  const activoRepo = new FakeActivoRepository();
  const catRepo = new FakeCategoriaActivoRepository();
  const auditor = new FakeAuditor();

  const cat1 = new CategoriaActivo(1, 'Mobiliario', true, 1);
  catRepo.categorias.push(cat1);

  const activo = new Activo(
    'act-1',
    'ACT-001',
    'Silla ergonómica',
    1,
    'Mobiliario',
    1,
    'disponible',
    250000,
    '2026-01-15',
    'Bueno',
    true,
  );
  activoRepo.activos.push(activo);

  const resolverAlcance = new ResolverAlcanceSucursalUseCase(mockUsuarioRepo, mockRolRepo, mockSucursalesRepo([1]));
  const useCase = new EditarActivoUseCase(activoRepo, catRepo, resolverAlcance, auditor);

  const res = await useCase.execute({
    activoId: 'act-1',
    nombre: 'Silla ergonómica Pro',
    valorAdquisicion: 300000,
    condicion: 'Excelente',
    actor,
  });

  assertEquals(res.isSuccess, true);
  const actualizado = res.value;
  assertEquals(actualizado.nombre, 'Silla ergonómica Pro');
  assertEquals(actualizado.valorAdquisicion, 300000);
  assertEquals(actualizado.condicion, 'Excelente');
  assertEquals(auditor.eventos.length, 1);
  assertEquals(auditor.eventos[0].accion, ACCIONES_AUDITORIA.EDITAR);
  assertEquals(auditor.eventos[0].entidad, ENTIDADES_AUDITORIA.ACTIVOS);
});

Deno.test('EditarActivoUseCase: falla si el activo está de baja', async () => {
  const activoRepo = new FakeActivoRepository();
  const catRepo = new FakeCategoriaActivoRepository();
  const auditor = new FakeAuditor();

  const activo = new Activo(
    'act-baja',
    'ACT-002',
    'Monitor viejo',
    null,
    null,
    1,
    'baja',
    100000,
    '2024-01-15',
    'Dañado',
    false,
  );
  activoRepo.activos.push(activo);

  const resolverAlcance = new ResolverAlcanceSucursalUseCase(mockUsuarioRepo, mockRolRepo, mockSucursalesRepo([1]));
  const useCase = new EditarActivoUseCase(activoRepo, catRepo, resolverAlcance, auditor);

  const res = await useCase.execute({
    activoId: 'act-baja',
    nombre: 'Monitor cambiado',
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'ACTIVO_DE_BAJA');
});

Deno.test('EditarActivoUseCase: falla si la sucursal está fuera de alcance', async () => {
  const activoRepo = new FakeActivoRepository();
  const catRepo = new FakeCategoriaActivoRepository();
  const auditor = new FakeAuditor();

  // Activo pertenece a sucursal 2, usuario solo tiene sucursal 1
  const activo = new Activo(
    'act-otra-sucursal',
    'ACT-003',
    'Impresora Sede 2',
    null,
    null,
    2,
    'disponible',
    400000,
    '2026-01-15',
    'Bueno',
    true,
  );
  activoRepo.activos.push(activo);

  const resolverAlcance = new ResolverAlcanceSucursalUseCase(mockUsuarioRepo, mockRolRepo, mockSucursalesRepo([1]));
  const useCase = new EditarActivoUseCase(activoRepo, catRepo, resolverAlcance, auditor);

  const res = await useCase.execute({
    activoId: 'act-otra-sucursal',
    nombre: 'Nuevo nombre',
    actor,
  });

  assertEquals(res.isFailure, true);
  assertEquals(res.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
});

Deno.test('ListarMantenimientosUseCase: lista mantenimientos con alcance y resumen', async () => {
  const mantenimientoRepo = new FakeMantenimientoActivoRepository();

  await mantenimientoRepo.crear({
    activoId: 'act-1',
    proveedorId: null,
    tipo: 'preventivo',
    fecha: '2026-11-01',
    costo: 50000,
    descripcion: 'Limpieza de ventiladores',
  });

  const resolverAlcance = new ResolverAlcanceSucursalUseCase(mockUsuarioRepo, mockRolRepo, mockSucursalesRepo([1]));
  const useCase = new ListarMantenimientosUseCase(mantenimientoRepo, resolverAlcance);

  const res = await useCase.execute({
    usuarioId: 'usr-1',
    sucursalId: 1,
    page: 1,
    limit: 20,
  });

  assertEquals(res.isSuccess, true);
  assertEquals(res.value.items.length, 1);
  assertEquals(res.value.items[0].activoCodigo, 'ACT-001');
  assertEquals(res.value.resumen?.enCurso, 1);
});
