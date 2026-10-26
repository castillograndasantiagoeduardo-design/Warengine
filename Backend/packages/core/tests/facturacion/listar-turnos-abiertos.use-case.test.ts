import { assertEquals } from 'jsr:@std/assert@^1';
import {
  IConsultaTurnosAbiertosRepository,
  IRolRepository,
  ISucursalesAutorizadasRepository,
  IUsuarioRepository,
  ListarTurnosAbiertosUseCase,
  PERMISO_ALCANCE_GLOBAL,
  ResolverAlcanceSucursalUseCase,
  Usuario,
} from '../../mod.ts';

function armar(global: boolean, sucursales: number[]) {
  const usuario = new Usuario('u-1', 'admin@warengine.local', 'hash', 2, true, false, null);
  const usuarios: IUsuarioRepository = {
    findByEmail: () => Promise.resolve(usuario),
    findById: () => Promise.resolve(usuario),
  };
  const roles: IRolRepository = {
    obtenerPermisosDeRol: () => Promise.resolve(global ? [PERMISO_ALCANCE_GLOBAL] : []),
  };
  const autorizadas: ISucursalesAutorizadasRepository = {
    obtenerIdsAutorizados: () => Promise.resolve(sucursales),
  };
  const llamadas: Array<number[] | undefined> = [];
  const consulta: IConsultaTurnosAbiertosRepository = {
    listarAbiertos: (ids) => {
      llamadas.push(ids);
      return Promise.resolve([]);
    },
  };
  const useCase = new ListarTurnosAbiertosUseCase(
    new ResolverAlcanceSucursalUseCase(usuarios, roles, autorizadas),
    consulta,
  );
  return { useCase, llamadas };
}

Deno.test('ListarTurnosAbiertos: admin de sucursal solo consulta sus sedes', async () => {
  const { useCase, llamadas } = armar(false, [2]);

  const propias = await useCase.execute({ usuarioId: 'u-1' });
  assertEquals(propias.isSuccess, true);
  assertEquals(llamadas[0], [2]);

  const ajena = await useCase.execute({ usuarioId: 'u-1', sucursalId: 1 });
  assertEquals(ajena.isFailure, true);
  assertEquals(ajena.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
  assertEquals(llamadas.length, 1);
});

Deno.test('ListarTurnosAbiertos: super-admin sin filtro consulta todas las sedes', async () => {
  const { useCase, llamadas } = armar(true, [1]);
  const result = await useCase.execute({ usuarioId: 'u-1' });
  assertEquals(result.isSuccess, true);
  assertEquals(llamadas[0], undefined);
});
