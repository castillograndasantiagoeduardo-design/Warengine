import { assertEquals } from 'jsr:@std/assert@^1';
import { IRolCatalogoRepository, ListarRolesUseCase, RolResumen } from '../../mod.ts';

class FakeRolCatalogoRepository implements IRolCatalogoRepository {
  constructor(private readonly roles: RolResumen[]) {}

  public listarRoles(): Promise<RolResumen[]> {
    return Promise.resolve([...this.roles].sort((a, b) => a.id - b.id));
  }
}

const ROLES = [
  new RolResumen(3, 'cajero', 'Operación de caja'),
  new RolResumen(1, 'super-admin', 'Control total'),
  new RolResumen(2, 'admin-sucursal', null),
  new RolResumen(4, 'vendedor-b2b', 'Ventas corporativas'),
];

Deno.test('RF-ADM-C7: Listar roles devuelve el catálogo completo ordenado por id', async () => {
  const useCase = new ListarRolesUseCase(new FakeRolCatalogoRepository(ROLES));
  const result = await useCase.execute();

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.map((r) => r.id), [1, 2, 3, 4]);
  assertEquals(result.value[0].nombre, 'super-admin');
});

Deno.test('RF-ADM-C7: Listar roles conserva descripciones nulas', async () => {
  const useCase = new ListarRolesUseCase(new FakeRolCatalogoRepository(ROLES));
  const result = await useCase.execute();

  assertEquals(result.value.find((r) => r.id === 2)?.descripcion, null);
});

Deno.test('RF-ADM-C7: Listar roles sin registros devuelve arreglo vacío', async () => {
  const useCase = new ListarRolesUseCase(new FakeRolCatalogoRepository([]));
  const result = await useCase.execute();

  assertEquals(result.isSuccess, true);
  assertEquals(result.value, []);
});
