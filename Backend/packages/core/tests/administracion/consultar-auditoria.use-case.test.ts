/**
 * consultar-auditoria.use-case.test.ts — RF-ADM-C11: consulta paginada y filtrable de la
 * auditoría. Usa un repositorio falso en memoria (sin tocar MySQL).
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import {
  ConsultarAuditoriaUseCase,
  FiltrosAuditoria,
  IAuditoriaRepository,
  LogAuditoria,
} from '../../mod.ts';
import { consultarAuditoriaSchema } from '@warengine/contracts';

function repoFalso(total = 0) {
  const llamadas: FiltrosAuditoria[] = [];
  const repo: IAuditoriaRepository = {
    registrar: () => Promise.resolve(),
    listar: (filtros) => {
      llamadas.push(filtros);
      const item = new LogAuditoria(
        'log-1', 'u-1', 'Ana', 'crear', 'sucursales', '1', { nombre: 'Norte' }, '127.0.0.1',
        new Date('2026-10-06T10:00:00Z'),
      );
      return Promise.resolve({ items: [item], total });
    },
  };
  return { repo, llamadas };
}

Deno.test('ConsultarAuditoria: sin filtros usa página 1 y límite 50', async () => {
  const { repo, llamadas } = repoFalso(120);
  const result = await new ConsultarAuditoriaUseCase(repo).execute();

  assertEquals(result.isSuccess, true);
  assertEquals(llamadas[0].limite, 50);
  assertEquals(llamadas[0].offset, 0);
  assertEquals(result.value.pagina, 1);
  assertEquals(result.value.totalPaginas, 3); // 120 / 50 → 3
});

Deno.test('ConsultarAuditoria: calcula el offset según la página', async () => {
  const { repo, llamadas } = repoFalso(500);
  await new ConsultarAuditoriaUseCase(repo).execute({ pagina: 3, limite: 20 });

  assertEquals(llamadas[0].offset, 40);
  assertEquals(llamadas[0].limite, 20);
});

Deno.test('ConsultarAuditoria: limita el tamaño de página a 200', async () => {
  const { repo, llamadas } = repoFalso();
  await new ConsultarAuditoriaUseCase(repo).execute({ limite: 5000 });

  assertEquals(llamadas[0].limite, 200);
});

Deno.test('ConsultarAuditoria: pasa los filtros de usuario, acción, entidad y fechas', async () => {
  const { repo, llamadas } = repoFalso();
  const desde = new Date('2026-10-01T00:00:00Z');
  const hasta = new Date('2026-10-06T23:59:59Z');

  await new ConsultarAuditoriaUseCase(repo).execute({
    usuarioId: 'u-1', accion: 'editar', entidad: 'usuarios', desde, hasta,
  });

  assertEquals(llamadas[0].usuarioId, 'u-1');
  assertEquals(llamadas[0].accion, 'editar');
  assertEquals(llamadas[0].entidad, 'usuarios');
  assertEquals(llamadas[0].desde, desde);
  assertEquals(llamadas[0].hasta, hasta);
});

Deno.test('ConsultarAuditoria: rechaza desde posterior a hasta sin consultar la BD', async () => {
  const { repo, llamadas } = repoFalso();
  const result = await new ConsultarAuditoriaUseCase(repo).execute({
    desde: new Date('2026-10-06T00:00:00Z'),
    hasta: new Date('2026-10-01T00:00:00Z'),
  });

  assertEquals(result.isFailure, true);
  assertEquals(result.error.code, 'FILTRO_AUDITORIA_INVALIDO');
  assertEquals(llamadas.length, 0);
});

Deno.test('ConsultarAuditoria Schema: valida accion y entidad contra el catalogo y rechaza valores fuera de el', () => {
  // Valores válidos
  const valido = consultarAuditoriaSchema.safeParse({
    accion: 'crear',
    entidad: 'categorias',
    pagina: '1',
    limite: '20',
  });
  assertEquals(valido.success, true);

  // Accion inválida
  const accionInvalida = consultarAuditoriaSchema.safeParse({
    accion: 'ACCION_INVENTADA',
  });
  assertEquals(accionInvalida.success, false);

  // Entidad inválida
  const entidadInvalida = consultarAuditoriaSchema.safeParse({
    entidad: 'tabla_fantasma',
  });
  assertEquals(entidadInvalida.success, false);
});