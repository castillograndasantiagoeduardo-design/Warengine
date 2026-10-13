/**
 * resolver-alcance-sucursal.use-case.test.ts — RNF-ADM-04: determina sobre qué sucursales puede
 * operar un usuario. Se decide por permiso (no por nombre de rol). Repositorios falsos en memoria.
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  IRolRepository,
  ISucursalesAutorizadasRepository,
  IUsuarioRepository,
  PERMISO_ALCANCE_GLOBAL,
  ResolverAlcanceSucursalUseCase,
  Usuario,
} from '../../mod.ts';

function usuarios(usuario: Usuario | null): IUsuarioRepository {
  return {
    findByEmail: () => Promise.resolve(usuario),
    findById: () => Promise.resolve(usuario),
  };
}

function roles(permisos: string[]): IRolRepository {
  return { obtenerPermisosDeRol: () => Promise.resolve(permisos) };
}

function sucursalesDe(ids: number[]) {
  const consultas: string[] = [];
  const repo: ISucursalesAutorizadasRepository = {
    obtenerIdsAutorizados: (usuarioId) => { consultas.push(usuarioId); return Promise.resolve(ids); },
  };
  return { repo, consultas };
}

const usuario = (rolId = 2) => new Usuario('u-1', 'a@warengine.local', 'hash', rolId, true, false, null);

Deno.test('ResolverAlcance: con el permiso global el alcance es global y no consulta sucursales', async () => {
  const { repo, consultas } = sucursalesDe([1]);
  const result = await new ResolverAlcanceSucursalUseCase(usuarios(usuario(1)), roles([PERMISO_ALCANCE_GLOBAL]), repo)
    .execute({ usuarioId: 'u-1' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.esGlobal, true);
  assertEquals(result.value.sucursalesPermitidas(), undefined);
  assertEquals(result.value.permite(999), true);
  assertEquals(consultas.length, 0);
});

Deno.test('ResolverAlcance: se decide por permiso, no por el número o nombre del rol', async () => {
  // Un rol cualquiera (id 99) que tenga el permiso global también es global.
  const { repo } = sucursalesDe([1]);
  const result = await new ResolverAlcanceSucursalUseCase(usuarios(usuario(99)), roles([PERMISO_ALCANCE_GLOBAL, 'x:y']), repo)
    .execute({ usuarioId: 'u-1' });

  assertEquals(result.value.esGlobal, true);
});

Deno.test('ResolverAlcance: sin permiso global queda limitado a sus sucursales', async () => {
  const { repo } = sucursalesDe([2, 1, 2]);
  const result = await new ResolverAlcanceSucursalUseCase(usuarios(usuario()), roles(['inventario:leer']), repo)
    .execute({ usuarioId: 'u-1' });

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.esGlobal, false);
  assertEquals(result.value.sucursalesPermitidas(), [1, 2]);
  assertEquals(result.value.permite(1), true);
  assertEquals(result.value.permite(2), true);
  assertEquals(result.value.permite(3), false);
});

Deno.test('ResolverAlcance: sin ninguna sucursal asignada no puede operar ninguna', async () => {
  const { repo } = sucursalesDe([]);
  const result = await new ResolverAlcanceSucursalUseCase(usuarios(usuario()), roles([]), repo)
    .execute({ usuarioId: 'u-1' });

  assertEquals(result.value.sucursalesPermitidas(), []);
  assertEquals(result.value.permite(1), false);
});

Deno.test('ResolverAlcance: falla si el usuario no existe', async () => {
  const { repo } = sucursalesDe([1]);
  const result = await new ResolverAlcanceSucursalUseCase(usuarios(null), roles([]), repo)
    .execute({ usuarioId: 'nadie' });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'TOKEN_INVALIDO');
});