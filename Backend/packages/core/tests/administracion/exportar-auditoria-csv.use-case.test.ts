import { assertEquals, assertInstanceOf } from 'https://deno.land/std@0.224.0/assert/mod.ts';
import {
  EventoAuditoria,
  ExportarAuditoriaCsvUseCase,
  FiltroAuditoriaInvalidoError,
  FiltrosAuditoria,
  IAuditoriaRepository,
  LogAuditoria,
  PaginaAuditoria,
} from '../../mod.ts';

class FakeAuditoriaRepository implements IAuditoriaRepository {
  public logs: LogAuditoria[] = [];
  public ultimosFiltrosRecibidos: FiltrosAuditoria | null = null;

  registrar(_evento: EventoAuditoria): Promise<void> {
    return Promise.resolve();
  }

  listar(filtros: FiltrosAuditoria): Promise<PaginaAuditoria> {
    this.ultimosFiltrosRecibidos = filtros;

    let filtrados = [...this.logs];

    if (filtros.usuarioId) {
      filtrados = filtrados.filter((l) => l.usuarioId === filtros.usuarioId);
    }
    if (filtros.accion) {
      filtrados = filtrados.filter((l) => l.accion === filtros.accion);
    }
    if (filtros.entidad) {
      filtrados = filtrados.filter((l) => l.entidad === filtros.entidad);
    }
    if (filtros.desde) {
      filtrados = filtrados.filter((l) => l.fecha >= filtros.desde!);
    }
    if (filtros.hasta) {
      filtrados = filtrados.filter((l) => l.fecha <= filtros.hasta!);
    }

    const items = filtrados.slice(filtros.offset, filtros.offset + filtros.limite);
    return Promise.resolve({
      items,
      total: filtrados.length,
    });
  }
}

Deno.test('RF-ADM-C20: ExportarAuditoriaCsvUseCase - Falla si fecha desde es posterior a hasta', async () => {
  const repo = new FakeAuditoriaRepository();
  const useCase = new ExportarAuditoriaCsvUseCase(repo);

  const result = await useCase.execute({
    desde: new Date('2026-10-15T00:00:00Z'),
    hasta: new Date('2026-10-10T00:00:00Z'),
  });

  assertEquals(result.isSuccess, false);
  assertInstanceOf(result.error, FiltroAuditoriaInvalidoError);
  assertEquals(result.error.code, 'FILTRO_AUDITORIA_INVALIDO');
});

Deno.test('RF-ADM-C20: ExportarAuditoriaCsvUseCase - Exporta registros en CSV RFC 4180 con BOM', async () => {
  const repo = new FakeAuditoriaRepository();
  repo.logs = [
    new LogAuditoria(
      'log-uuid-1',
      'user-uuid-1',
      'Super Admin',
      'crear',
      'sucursales',
      '2',
      { despues: { nombre: 'Sucursal Norte, S.A.' } },
      '192.168.1.50',
      new Date('2026-10-16T12:00:00.000Z'),
    ),
    new LogAuditoria(
      'log-uuid-2',
      null,
      null,
      'inactivar',
      'usuarios',
      'user-uuid-9',
      null,
      null,
      new Date('2026-10-16T13:00:00.000Z'),
    ),
  ];

  const useCase = new ExportarAuditoriaCsvUseCase(repo);
  const result = await useCase.execute();

  assertEquals(result.isSuccess, true);
  const data = result.value;
  assertEquals(data.total, 2);
  assertEquals(data.nombreArchivo.startsWith('auditoria_export_'), true);
  assertEquals(data.nombreArchivo.endsWith('.csv'), true);

  // Verificación de BOM UTF-8 (\uFEFF)
  assertEquals(data.csv.startsWith('\uFEFF'), true);

  const lineas = data.csv.replace('\uFEFF', '').split('\r\n');
  assertEquals(
    lineas[0],
    'ID_Log,Fecha,Usuario_ID,Usuario_Nombre,Accion,Entidad,Entidad_ID,IP,Detalles',
  );

  // Fila 1 debe escapar comas y comillas en el JSON de detalles conforme a RFC 4180
  assertEquals(lineas[1].includes('log-uuid-1'), true);
  assertEquals(lineas[1].includes('Super Admin'), true);
  assertEquals(lineas[1].includes('"{""despues"":{""nombre"":""Sucursal Norte, S.A.""}}"'), true);

  // Fila 2 con usuario nulo
  assertEquals(lineas[2].includes('log-uuid-2'), true);
  assertEquals(lineas[2].includes('inactivar'), true);
});

Deno.test('RF-ADM-C20: ExportarAuditoriaCsvUseCase - Aplica filtros de usuario, accion y entidad', async () => {
  const repo = new FakeAuditoriaRepository();
  repo.logs = [
    new LogAuditoria(
      'log-1',
      'user-1',
      'Admin',
      'crear',
      'usuarios',
      'u-1',
      null,
      null,
      new Date('2026-10-16T10:00:00Z'),
    ),
    new LogAuditoria(
      'log-2',
      'user-2',
      'Cajero',
      'editar',
      'productos',
      'p-1',
      null,
      null,
      new Date('2026-10-16T11:00:00Z'),
    ),
  ];

  const useCase = new ExportarAuditoriaCsvUseCase(repo);
  const result = await useCase.execute({
    usuarioId: 'user-1',
    accion: 'crear',
    entidad: 'usuarios',
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.total, 1);
  assertEquals(repo.ultimosFiltrosRecibidos?.usuarioId, 'user-1');
  assertEquals(repo.ultimosFiltrosRecibidos?.accion, 'crear');
  assertEquals(repo.ultimosFiltrosRecibidos?.entidad, 'usuarios');
});
