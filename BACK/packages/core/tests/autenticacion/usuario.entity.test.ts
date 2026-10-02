/**
 * usuario.entity.test.ts — Pruebas unitarias de la entidad Usuario.
 * Verifica la regla de negocio de tokens_invalidados_en.
 */
import { assertEquals } from 'jsr:@std/assert@^1';
import { Usuario } from '../../mod.ts';

function makeUsuario(invalidadoEn: Date | null) {
  return new Usuario('uuid-001', 'test@warengine.local', 'hash', 1, true, false, invalidadoEn);
}

Deno.test('Usuario: token válido si no hay fecha de invalidación', () => {
  const usuario = makeUsuario(null);
  const tokenIat = new Date('2026-06-01T10:00:00Z');

  assertEquals(usuario.credencialesFueronInvalidadas(tokenIat), false);
});

Deno.test('Usuario: token inválido si fue emitido ANTES de la invalidación', () => {
  const invalidadoEn = new Date('2026-06-01T12:00:00Z');
  const tokenIat     = new Date('2026-06-01T10:00:00Z'); // anterior → inválido

  const usuario = makeUsuario(invalidadoEn);
  assertEquals(usuario.credencialesFueronInvalidadas(tokenIat), true);
});

Deno.test('Usuario: token inválido si fue emitido EN EL MISMO INSTANTE de la invalidación', () => {
  const fecha    = new Date('2026-06-01T12:00:00Z');
  const usuario  = makeUsuario(fecha);

  assertEquals(usuario.credencialesFueronInvalidadas(fecha), true);
});

Deno.test('Usuario: token válido si fue emitido DESPUÉS de la invalidación', () => {
  const invalidadoEn = new Date('2026-06-01T12:00:00Z');
  const tokenIat     = new Date('2026-06-01T13:00:00Z'); // posterior → válido

  const usuario = makeUsuario(invalidadoEn);
  assertEquals(usuario.credencialesFueronInvalidadas(tokenIat), false);
});
