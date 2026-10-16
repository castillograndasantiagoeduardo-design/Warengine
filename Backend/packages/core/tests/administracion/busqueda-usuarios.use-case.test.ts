import { assertEquals } from 'jsr:@std/assert@^1';
import {
  FiltrosUsuarios,
  IGestionUsuarioRepository,
  ListarUsuariosUseCase,
  UsuarioGestionado,
} from '../../mod.ts';

class FakeGestionUsuarioRepository implements Partial<IGestionUsuarioRepository> {
  public usuarios: UsuarioGestionado[] = [];

  public listar(filtros: FiltrosUsuarios): Promise<UsuarioGestionado[]> {
    let resultado = [...this.usuarios];

    if (filtros.rolId) {
      resultado = resultado.filter((u) => u.rolId === filtros.rolId);
    }

    if (filtros.sucursalId) {
      resultado = resultado.filter((u) => u.sucursalId === filtros.sucursalId);
    }

    const termino = (filtros.busqueda ?? filtros.texto)?.trim().toLowerCase();
    if (termino) {
      resultado = resultado.filter(
        (u) =>
          u.nombre.toLowerCase().includes(termino) ||
          u.email.toLowerCase().includes(termino),
      );
    }

    return Promise.resolve(resultado);
  }
}

const mockUsuarios: UsuarioGestionado[] = [
  new UsuarioGestionado('u-1', 'Santiago Castillo', 'santiago@warengine.local', 1, 'super-admin', 1, 'Sede Principal', true),
  new UsuarioGestionado('u-2', 'Carlos Cajero', 'carlos.ventas@warengine.local', 3, 'cajero-vendedor', 1, 'Sede Principal', true),
  new UsuarioGestionado('u-3', 'Ana María Gómez', 'ana.gomez@warengine.local', 2, 'admin-sucursal', 2, 'Sede Norte', true),
  new UsuarioGestionado('u-4', 'Beatriz Vendedora', 'beatriz.b2b@warengine.local', 4, 'vendedor-b2b', 2, 'Sede Norte', false),
];

Deno.test('RF-ADM-C16: Listar usuarios sin filtros retorna la totalidad', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({});

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.length, 4);
});

Deno.test('RF-ADM-C16: Buscar usuarios por coincidencia en el nombre', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({ busqueda: 'castillo' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.length, 1);
  assertEquals(result.value[0].nombre, 'Santiago Castillo');
});

Deno.test('RF-ADM-C16: Buscar usuarios por coincidencia en el correo electrónico', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({ texto: 'carlos.ventas' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.length, 1);
  assertEquals(result.value[0].email, 'carlos.ventas@warengine.local');
});

Deno.test('RF-ADM-C16: Combinar búsqueda textual con filtro de rol', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  
  // Búsqueda que coincide con 'Sede Norte' pero filtrada por rolId=2 (admin-sucursal)
  const result = await useCase.execute({
    busqueda: 'warengine.local',
    rolId: 2,
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.length, 1);
  assertEquals(result.value[0].email, 'ana.gomez@warengine.local');
});

Deno.test('RF-ADM-C16: Combinar búsqueda textual con filtro de sucursal', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  
  // Coincide con 'warengine' en sucursalId=1 (Sede Principal)
  const result = await useCase.execute({
    busqueda: 'warengine',
    sucursalId: 1,
  });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.length, 2);
  assertEquals(result.value.map((u) => u.nombre), ['Santiago Castillo', 'Carlos Cajero']);
});

Deno.test('RF-ADM-C16: Búsqueda sin coincidencias retorna lista vacía', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({ busqueda: 'no-existe-xyz' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.length, 0);
});
