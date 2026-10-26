import { assertEquals } from 'jsr:@std/assert@^1';
import {
  FiltrosUsuarios,
  IGestionUsuarioRepository,
  ListarUsuariosUseCase,
  PaginacionUsuarios,
  ResultadoPaginaUsuarios,
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

    if (filtros.isActive !== undefined) {
      resultado = resultado.filter((u) => u.isActive === filtros.isActive);
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

  public async listarPaginado(
    filtros: FiltrosUsuarios,
    paginacion: PaginacionUsuarios,
  ): Promise<ResultadoPaginaUsuarios> {
    const todos = await this.listar(filtros);
    const inicio = (paginacion.pagina - 1) * paginacion.limite;
    return { items: todos.slice(inicio, inicio + paginacion.limite), total: todos.length };
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
  assertEquals(result.value.items.length, 4);
});

Deno.test('RF-ADM-C16: Buscar usuarios por coincidencia en el nombre', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({ busqueda: 'castillo' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.items.length, 1);
  assertEquals(result.value.items[0].nombre, 'Santiago Castillo');
});

Deno.test('RF-ADM-C16: Buscar usuarios por coincidencia en el correo electrónico', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({ texto: 'carlos.ventas' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.items.length, 1);
  assertEquals(result.value.items[0].email, 'carlos.ventas@warengine.local');
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
  assertEquals(result.value.items.length, 1);
  assertEquals(result.value.items[0].email, 'ana.gomez@warengine.local');
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
  assertEquals(result.value.items.length, 2);
  assertEquals(result.value.items.map((u) => u.nombre), ['Santiago Castillo', 'Carlos Cajero']);
});

Deno.test('RF-ADM-C16: Búsqueda sin coincidencias retorna lista vacía', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({ busqueda: 'no-existe-xyz' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.items.length, 0);
});

Deno.test('RF-ADM-C5: Paginación devuelve la página pedida y metadatos { total, pagina, limite, totalPaginas }', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({ pagina: 2, limite: 3 });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.items.length, 1);
  assertEquals(result.value.items[0].id, 'u-4');
  assertEquals(result.value.total, 4);
  assertEquals(result.value.pagina, 2);
  assertEquals(result.value.limite, 3);
  assertEquals(result.value.totalPaginas, 2);
});

Deno.test('RF-ADM-C5: Sin paginación explícita usa página 1 y límite 20', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute();

  assertEquals(result.value.pagina, 1);
  assertEquals(result.value.limite, 20);
  assertEquals(result.value.totalPaginas, 1);
});

Deno.test('RF-ADM-C5: Filtro por estado combinable con rol y sucursal', async () => {
  const repo = new FakeGestionUsuarioRepository();
  repo.usuarios = [...mockUsuarios];

  const useCase = new ListarUsuariosUseCase(repo as unknown as IGestionUsuarioRepository);
  const result = await useCase.execute({ isActive: false, sucursalId: 2 });

  assertEquals(result.value.items.map((u) => u.id), ['u-4']);
  assertEquals(result.value.total, 1);
});

Deno.test('RF-ADM-C10: El usuario expone sus sedes adicionales', () => {
  const usuario = new UsuarioGestionado('u-9', 'Multi Sede', 'multi@warengine.local', 2, 'admin-sucursal', 1, 'Sede Principal', true, [
    { id: 2, nombre: 'Sede Norte' },
  ]);
  assertEquals(usuario.sucursalesAdicionales, [{ id: 2, nombre: 'Sede Norte' }]);
});
