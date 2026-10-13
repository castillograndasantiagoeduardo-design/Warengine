/**
 * consultar-alertas-stock.use-case.test.ts — RF-ADM-A6 (alertas de stock bajo) con alcance por
 * sucursal (RNF-ADM-04). Repositorios falsos en memoria (sin tocar MySQL).
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  AlertaStock,
  ConsultarAlertasStockUseCase,
  FiltrosAlertasStock,
  IAlertaStockRepository,
  IRolRepository,
  ISucursalesAutorizadasRepository,
  IUsuarioRepository,
  PERMISO_ALCANCE_GLOBAL,
  ResolverAlcanceSucursalUseCase,
  Usuario,
} from '../../mod.ts';

function armar(opciones: { global: boolean; sucursales: number[]; usuarioExiste?: boolean }) {
  const usuario = opciones.usuarioExiste === false
    ? null
    : new Usuario('u-1', 'a@warengine.local', 'hash', 2, true, false, null);
  const usuarios: IUsuarioRepository = {
    findByEmail: () => Promise.resolve(usuario),
    findById: () => Promise.resolve(usuario),
  };
  const roles: IRolRepository = {
    obtenerPermisosDeRol: () => Promise.resolve(opciones.global ? [PERMISO_ALCANCE_GLOBAL] : ['inventario:leer']),
  };
  const autorizadas: ISucursalesAutorizadasRepository = {
    obtenerIdsAutorizados: () => Promise.resolve(opciones.sucursales),
  };
  const llamadas: FiltrosAlertasStock[] = [];
  const alertas: IAlertaStockRepository = {
    listar: (filtros) => {
      llamadas.push(filtros);
      return Promise.resolve({ items: [], total: 0, page: filtros.page, limit: filtros.limit, totalPages: 1 });
    },
  };
  const useCase = new ConsultarAlertasStockUseCase(
    new ResolverAlcanceSucursalUseCase(usuarios, roles, autorizadas),
    alertas,
  );
  return { useCase, llamadas };
}

const base = { usuarioId: 'u-1', page: 1, limit: 10 };

Deno.test('Alertas: el Super Admin sin filtro ve todas las sucursales (sin restricción)', async () => {
  const { useCase, llamadas } = armar({ global: true, sucursales: [1] });
  const result = await useCase.execute(base);

  assertEquals(result.isSuccess, true);
  assertEquals(llamadas[0].sucursalIds, undefined);
});

Deno.test('Alertas: el Super Admin puede pedir cualquier sucursal', async () => {
  const { useCase, llamadas } = armar({ global: true, sucursales: [1] });
  await useCase.execute({ ...base, sucursalId: 9 });

  assertEquals(llamadas[0].sucursalIds, [9]);
});

Deno.test('Alertas: un usuario con alcance limitado sin filtro ve solo sus sucursales', async () => {
  const { useCase, llamadas } = armar({ global: false, sucursales: [1, 2] });
  await useCase.execute(base);

  assertEquals(llamadas[0].sucursalIds, [1, 2]);
});

Deno.test('Alertas: un usuario limitado puede pedir una de sus sucursales', async () => {
  const { useCase, llamadas } = armar({ global: false, sucursales: [1, 2] });
  const result = await useCase.execute({ ...base, sucursalId: 2 });

  assertEquals(result.isSuccess, true);
  assertEquals(llamadas[0].sucursalIds, [2]);
});

Deno.test('Alertas: un usuario limitado NO puede pedir una sucursal ajena (y no se consulta la BD)', async () => {
  const { useCase, llamadas } = armar({ global: false, sucursales: [1, 2] });
  const result = await useCase.execute({ ...base, sucursalId: 3 });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'SUCURSAL_FUERA_DE_ALCANCE');
  assertEquals(llamadas.length, 0);
});

Deno.test('Alertas: sin ninguna sucursal asignada devuelve vacío sin consultar la BD', async () => {
  const { useCase, llamadas } = armar({ global: false, sucursales: [] });
  const result = await useCase.execute(base);

  assertEquals(result.isSuccess, true);
  assertEquals(result.value.items, []);
  assertEquals(result.value.total, 0);
  assertEquals(llamadas.length, 0);
});

Deno.test('Alertas: pasa la paginación al repositorio', async () => {
  const { useCase, llamadas } = armar({ global: true, sucursales: [] });
  await useCase.execute({ ...base, page: 3, limit: 25 });

  assertEquals(llamadas[0].page, 3);
  assertEquals(llamadas[0].limit, 25);
});

Deno.test('Alertas: falla si el usuario del token ya no existe', async () => {
  const { useCase, llamadas } = armar({ global: true, sucursales: [], usuarioExiste: false });
  const result = await useCase.execute(base);

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'TOKEN_INVALIDO');
  assertEquals(llamadas.length, 0);
});

Deno.test('AlertaStock: calcula las unidades que faltan para el mínimo', () => {
  assertEquals(new AlertaStock('p', 'SKU', 'Prod', 1, 'Centro', 2, 10).faltante, 8);
  assertEquals(new AlertaStock('p', 'SKU', 'Prod', 1, 'Centro', 10, 10).faltante, 0);
  assertEquals(new AlertaStock('p', 'SKU', 'Prod', 1, 'Centro', 0, 0).faltante, 0);
});