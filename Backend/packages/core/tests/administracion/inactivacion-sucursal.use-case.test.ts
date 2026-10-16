import { assertEquals } from 'jsr:@std/assert@^1';
import {
  EditarSucursalUseCase,
  ISucursalRepository,
  DatosSucursal,
  Sucursal,
  IAuditor,
  EventoAuditoria,
  ActorAuditoria,
} from '../../mod.ts';

class FakeSucursalRepository implements ISucursalRepository {
  public sucursales: Map<number, Sucursal> = new Map();
  public usuariosActivosPorSucursal: Map<number, number> = new Map();

  public listar(): Promise<Sucursal[]> {
    return Promise.resolve([...this.sucursales.values()]);
  }

  public findById(id: number): Promise<Sucursal | null> {
    return Promise.resolve(this.sucursales.get(id) ?? null);
  }

  public findByNombre(nombre: string): Promise<Sucursal | null> {
    const s = [...this.sucursales.values()].find(
      (suc) => suc.nombre.toLowerCase() === nombre.toLowerCase(),
    );
    return Promise.resolve(s ?? null);
  }

  public crear(datos: DatosSucursal): Promise<Sucursal> {
    const id = this.sucursales.size + 1;
    const suc = new Sucursal(id, datos.nombre, datos.direccion ?? null, datos.contacto ?? null, true);
    this.sucursales.set(id, suc);
    return Promise.resolve(suc);
  }

  public actualizar(
    id: number,
    cambios: Partial<DatosSucursal> & { isActive?: boolean },
  ): Promise<Sucursal> {
    const existente = this.sucursales.get(id);
    if (!existente) throw new Error('No encontrada');
    const actualizada = new Sucursal(
      id,
      cambios.nombre ?? existente.nombre,
      cambios.direccion !== undefined ? cambios.direccion : existente.direccion,
      cambios.contacto !== undefined ? cambios.contacto : existente.contacto,
      cambios.isActive !== undefined ? cambios.isActive : existente.isActive,
    );
    this.sucursales.set(id, actualizada);
    return Promise.resolve(actualizada);
  }

  public contarUsuariosActivos(sucursalId: number): Promise<number> {
    return Promise.resolve(this.usuariosActivosPorSucursal.get(sucursalId) ?? 0);
  }
}

class FakeAuditor implements IAuditor {
  public registros: EventoAuditoria[] = [];
  public registrar(evento: EventoAuditoria): Promise<void> {
    this.registros.push(evento);
    return Promise.resolve();
  }
}

const actorAdmin: ActorAuditoria = {
  usuarioId: 'admin-root',
  ip: '127.0.0.1',
  permisos: ['administracion:gestionar-sucursales'],
};

Deno.test('RF-ADM-C17 / Regla 6: Rechaza inactivación de Sede Principal (id=1) y NO audita', async () => {
  const repo = new FakeSucursalRepository();
  repo.sucursales.set(1, new Sucursal(1, 'Sede Principal', 'Calle 1 # 1-1', 'PBX 01', true));
  repo.usuariosActivosPorSucursal.set(1, 0);

  const auditor = new FakeAuditor();
  const useCase = new EditarSucursalUseCase(repo, auditor);

  const result = await useCase.execute({
    id: 1,
    isActive: false,
    actor: actorAdmin,
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SEDE_PRINCIPAL_NO_INACTIVABLE');
  assertEquals(auditor.registros.length, 0);
  assertEquals((await repo.findById(1))?.isActive, true);
});

Deno.test('RF-ADM-C17: Rechaza inactivación si la sucursal tiene usuarios activos asignados y NO audita', async () => {
  const repo = new FakeSucursalRepository();
  repo.sucursales.set(2, new Sucursal(2, 'Sede Norte', 'Avenida 5 # 10-20', '3001234567', true));
  repo.usuariosActivosPorSucursal.set(2, 3); // 3 colaboradores activos

  const auditor = new FakeAuditor();
  const useCase = new EditarSucursalUseCase(repo, auditor);

  const result = await useCase.execute({
    id: 2,
    isActive: false,
    actor: actorAdmin,
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_TIENE_USUARIOS_ACTIVOS');
  assertEquals(result.error.message.includes('3 usuario(s) activo(s)'), true);
  assertEquals(auditor.registros.length, 0);
  assertEquals((await repo.findById(2))?.isActive, true);
});

Deno.test('RF-ADM-C17: Permite inactivar sucursal secundaria sin usuarios activos y audita', async () => {
  const repo = new FakeSucursalRepository();
  repo.sucursales.set(2, new Sucursal(2, 'Sede Norte', 'Avenida 5 # 10-20', '3001234567', true));
  repo.usuariosActivosPorSucursal.set(2, 0); // 0 usuarios asignados

  const auditor = new FakeAuditor();
  const useCase = new EditarSucursalUseCase(repo, auditor);

  const result = await useCase.execute({
    id: 2,
    isActive: false,
    actor: actorAdmin,
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.isActive, false);
  assertEquals((await repo.findById(2))?.isActive, false);

  assertEquals(auditor.registros.length, 1);
  assertEquals(auditor.registros[0].entidad, 'sucursales');
  assertEquals(auditor.registros[0].entidadId, '2');
  assertEquals(auditor.registros[0].detalles?.antes, { isActive: true });
  assertEquals(auditor.registros[0].detalles?.despues, { isActive: false });
});

Deno.test('RF-ADM-C17: Permite reactivar sucursal inactiva', async () => {
  const repo = new FakeSucursalRepository();
  repo.sucursales.set(3, new Sucursal(3, 'Sede Sur', 'Carrera 8 # 20-30', '3109876543', false));
  repo.usuariosActivosPorSucursal.set(3, 0);

  const auditor = new FakeAuditor();
  const useCase = new EditarSucursalUseCase(repo, auditor);

  const result = await useCase.execute({
    id: 3,
    isActive: true,
    actor: actorAdmin,
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.isActive, true);
  assertEquals((await repo.findById(3))?.isActive, true);
});

Deno.test('RF-ADM-C17: Falla con SUCURSAL_NO_ENCONTRADA si el id no existe', async () => {
  const repo = new FakeSucursalRepository();
  const auditor = new FakeAuditor();
  const useCase = new EditarSucursalUseCase(repo, auditor);

  const result = await useCase.execute({
    id: 999,
    isActive: false,
    actor: actorAdmin,
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_NO_ENCONTRADA');
  assertEquals(auditor.registros.length, 0);
});
