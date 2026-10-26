import { assert, assertEquals } from 'jsr:@std/assert@^1';
import {
  CATEGORIAS_DEMO,
  EMPLEADOS_DEMO,
  PRODUCTOS_DEMO,
  PROVEEDORES_DEMO,
  SKUS_BAJO_MINIMO,
  SUCURSALES_DEMO,
} from '../src/seeds/demo.data.ts';

Deno.test('Seed demo: SKUs únicos y productos con categoría y proveedor válidos', () => {
  const skus = PRODUCTOS_DEMO.map((p) => p.sku);
  assertEquals(new Set(skus).size, skus.length);
  for (const p of PRODUCTOS_DEMO) {
    assert(CATEGORIAS_DEMO.includes(p.categoria), `categoría inválida en ${p.sku}`);
    assert(p.proveedor >= 0 && p.proveedor < PROVEEDORES_DEMO.length, `proveedor inválido en ${p.sku}`);
    assert(p.venta > p.compra, `precio de venta debe superar al de compra en ${p.sku}`);
  }
});

Deno.test('Seed demo: los SKU bajo mínimo existen en el catálogo', () => {
  const skus = new Set(PRODUCTOS_DEMO.map((p) => p.sku));
  for (const lista of Object.values(SKUS_BAJO_MINIMO)) {
    for (const sku of lista) assert(skus.has(sku), `SKU ${sku} no existe`);
  }
});

Deno.test('Seed demo: cuentas de prueba únicas, con dominio @warengine.local y sin contraseñas', () => {
  const cuentas = EMPLEADOS_DEMO.flatMap((e) => (e.cuenta ? [e.cuenta] : []));
  const correos = cuentas.map((c) => c.email);
  assertEquals(new Set(correos).size, correos.length);
  for (const correo of correos) assert(correo.endsWith('@warengine.local'), correo);
  for (const requerido of ['admin.norte@warengine.local', 'cajero1@warengine.local', 'vendedor.b2b@warengine.local']) {
    assert(correos.includes(requerido), `falta ${requerido}`);
  }
  for (const e of EMPLEADOS_DEMO) assert(!('password' in e) && !('password' in (e.cuenta ?? {})));
});

Deno.test('Seed demo: documentos únicos, áreas existentes y salarios en orden cronológico', () => {
  const docs = EMPLEADOS_DEMO.map((e) => e.documento);
  assertEquals(new Set(docs).size, docs.length);
  assert(EMPLEADOS_DEMO.length >= 10);
  for (const e of EMPLEADOS_DEMO) {
    if (e.sede !== 'principal') {
      const sede = SUCURSALES_DEMO.find((s) => s.clave === e.sede)!;
      assert(sede.areas.includes(e.area), `área ${e.area} no existe en ${sede.nombre}`);
    }
    const fechas = e.salarios.map(([f]) => f);
    assertEquals([...fechas].sort(), fechas, `historial desordenado de ${e.nombre}`);
  }
});
