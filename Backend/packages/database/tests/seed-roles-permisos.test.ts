import { assertEquals, assertNotEquals } from 'jsr:@std/assert';
import { getDatabase, closeDatabase } from '../src/client.ts';
import { seedAutenticacion, ROLES, PERMISOS, ASIGNACIONES } from '../src/seeds/autenticacion.seed.ts';
import { roles, permisos, rol_permisos } from '../src/schema/autenticacion.schema.ts';

function cargarEnvSiEsNecesario() {
  if (Deno.env.get('DB_PASSWORD')) return;
  const posiblesRutas = ['.env', '../.env', '../../.env', '../../../.env', '../../../../.env'];
  for (const ruta of posiblesRutas) {
    try {
      const texto = Deno.readTextFileSync(ruta);
      for (const linea of texto.split('\n')) {
        const limpia = linea.trim();
        if (limpia && !limpia.startsWith('#') && limpia.includes('=')) {
          const [clave, ...resto] = limpia.split('=');
          const valor = resto.join('=').trim();
          if (!Deno.env.get(clave.trim())) {
            Deno.env.set(clave.trim(), valor);
          }
        }
      }
      break;
    } catch {
      // Intentar siguiente ruta
    }
  }
}

Deno.test('Seed de Autenticación: especificación de roles y permisos en código', () => {
  // 1. Roles vigentes
  assertEquals(ROLES.map((r) => r.nombre), ['super-admin', 'admin-sucursal', 'cajero', 'vendedor-b2b']);
  assertEquals(ROLES.find((r) => r.id_rol === 3)?.nombre, 'cajero');
  assertEquals(ROLES.find((r) => r.id_rol === 4)?.nombre, 'vendedor-b2b');

  // 2. Permisos nuevos y descripciones
  const permFacturar = PERMISOS.find((p) => p.codigo === 'facturacion:facturar');
  assertEquals(permFacturar?.descripcion, 'Emitir facturas y cobrar');

  const codigos = PERMISOS.map((p) => p.codigo);
  assertEquals(codigos.includes('facturacion:abrir-turno'), true);
  assertEquals(codigos.includes('facturacion:vender-b2b'), true);
  assertEquals(codigos.includes('facturacion:alertar-admin'), true);

  // 3. Matriz exacta en asignaciones
  const esperadoCajero = [
    'inventario:leer',
    'facturacion:consultar',
    'facturacion:facturar',
    'facturacion:gestionar-clientes',
    'facturacion:abrir-turno',
    'facturacion:vender-b2b',
    'facturacion:alertar-admin',
    'mcp:consultar',
  ].sort();
  assertEquals([...ASIGNACIONES['cajero']].sort(), esperadoCajero);
  assertEquals(ASIGNACIONES['cajero'].includes('logistica:leer'), false);

  const esperadoVendedorB2b = [
    'inventario:leer',
    'facturacion:consultar',
    'facturacion:facturar',
    'facturacion:gestionar-clientes',
    'facturacion:vender-b2b',
    'facturacion:alertar-admin',
    'mcp:consultar',
  ].sort();
  assertEquals([...ASIGNACIONES['vendedor-b2b']].sort(), esperadoVendedorB2b);
  assertEquals(ASIGNACIONES['vendedor-b2b'].includes('facturacion:abrir-turno'), false);
  assertEquals(ASIGNACIONES['vendedor-b2b'].includes('logistica:leer'), false);

  const esperadoAdminSucursal = [
    'inventario:leer',
    'inventario:escribir',
    'inventario:registrar-movimiento',
    'inventario:ajustar-stock',
    'inventario:ver-kardex',
    'facturacion:facturar',
    'facturacion:abrir-turno',
    'facturacion:vender-b2b',
    'facturacion:consultar',
    'facturacion:gestionar-clientes',
    'facturacion:anular',
    'facturacion:devolucion',
    'administracion:gestionar-personal',
    'administracion:ver-metricas-sucursal',
    'administracion:gestionar-alertas',
    'logistica:leer',
    'logistica:gestionar-activos',
    'logistica:asignar-activos',
    'logistica:mantenimiento',
    'mcp:consultar',
    'mcp:ejecutar-herramientas',
  ].sort();
  assertEquals([...ASIGNACIONES['admin-sucursal']].sort(), esperadoAdminSucursal);
  assertEquals(ASIGNACIONES['super-admin'].length, PERMISOS.length);
});

Deno.test('Seed de Autenticación: matriz rol -> permisos exacta en base de datos real', async () => {
  cargarEnvSiEsNecesario();
  const db = getDatabase();

  try {
    // Ejecutar seed para garantizar consistencia e idempotencia
    await seedAutenticacion(db);

    const rolesDb = await db.select().from(roles);
    const permisosDb = await db.select().from(permisos);
    const relacionesDb = await db.select().from(rol_permisos);

    const rolesMap = new Map(rolesDb.map((r) => [r.nombre, r.id_rol]));
    const permisosIdMap = new Map(permisosDb.map((p) => [p.id_permiso, p.codigo]));

    const permisosPorRol = (nombreRol: string): string[] => {
      const rolId = rolesMap.get(nombreRol);
      if (!rolId) return [];
      return relacionesDb
        .filter((rel) => rel.rol_id === rolId)
        .map((rel) => permisosIdMap.get(rel.permiso_id)!)
        .filter(Boolean)
        .sort();
    };

    // 1. Roles existentes
    assertEquals(rolesMap.has('super-admin'), true);
    assertEquals(rolesMap.has('admin-sucursal'), true);
    assertEquals(rolesMap.has('cajero'), true);
    assertEquals(rolesMap.has('vendedor-b2b'), true);
    assertEquals(rolesMap.has('cajero-vendedor'), false); // Ya no debe existir

    // 2. Permisos nuevos y descripciones
    const permAbrirTurno = permisosDb.find((p) => p.codigo === 'facturacion:abrir-turno');
    const permVenderB2b = permisosDb.find((p) => p.codigo === 'facturacion:vender-b2b');
    const permAlertarAdmin = permisosDb.find((p) => p.codigo === 'facturacion:alertar-admin');
    const permFacturar = permisosDb.find((p) => p.codigo === 'facturacion:facturar');

    assertNotEquals(permAbrirTurno, undefined);
    assertNotEquals(permVenderB2b, undefined);
    assertNotEquals(permAlertarAdmin, undefined);
    assertEquals(permFacturar?.descripcion, 'Emitir facturas y cobrar');

    // 3. Matriz exacta
    const permisosSuperAdmin = permisosPorRol('super-admin');
    assertEquals(permisosSuperAdmin.length, permisosDb.length);

    const permisosAdminSucursal = permisosPorRol('admin-sucursal');
    const esperadoAdminSucursal = [
      'inventario:leer',
      'inventario:escribir',
      'inventario:registrar-movimiento',
      'inventario:ajustar-stock',
      'inventario:ver-kardex',
      'facturacion:facturar',
      'facturacion:abrir-turno',
      'facturacion:vender-b2b',
      'facturacion:consultar',
      'facturacion:gestionar-clientes',
      'facturacion:anular',
      'facturacion:devolucion',
      'administracion:gestionar-personal',
      'administracion:ver-metricas-sucursal',
      'administracion:gestionar-alertas',
      'logistica:leer',
      'logistica:gestionar-activos',
      'logistica:asignar-activos',
      'logistica:mantenimiento',
      'mcp:consultar',
      'mcp:ejecutar-herramientas',
    ].sort();
    assertEquals(permisosAdminSucursal, esperadoAdminSucursal);

    const permisosCajero = permisosPorRol('cajero');
    const esperadoCajero = [
      'inventario:leer',
      'facturacion:consultar',
      'facturacion:facturar',
      'facturacion:gestionar-clientes',
      'facturacion:abrir-turno',
      'facturacion:vender-b2b',
      'facturacion:alertar-admin',
      'mcp:consultar',
    ].sort();
    assertEquals(permisosCajero, esperadoCajero);
    assertEquals(permisosCajero.includes('logistica:leer'), false);

    const permisosVendedorB2b = permisosPorRol('vendedor-b2b');
    const esperadoVendedorB2b = [
      'inventario:leer',
      'facturacion:consultar',
      'facturacion:facturar',
      'facturacion:gestionar-clientes',
      'facturacion:vender-b2b',
      'facturacion:alertar-admin',
      'mcp:consultar',
    ].sort();
    assertEquals(permisosVendedorB2b, esperadoVendedorB2b);
    assertEquals(permisosVendedorB2b.includes('facturacion:abrir-turno'), false);
    assertEquals(permisosVendedorB2b.includes('logistica:leer'), false);
  } finally {
    await closeDatabase();
  }
});
