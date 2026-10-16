/**
 * limpiar-negocio.seed.ts — Script de vaciado de datos operativos y de negocio en Warengine.
 *
 * Elimina:
 *   - Facturación: facturas, factura_items, factura_pagos, devoluciones_ventas, turnos_caja, clientes
 *   - Inventario: movimientos_inventario, inventario_sucursal, productos, proveedores, categorias
 *   - Activos: mantenimientos_activos, asignaciones_activos, activos, categorias_activos
 *   - Alertas y logs operativos: alertas_admin, logs_auditoria, logs_mcp_tools
 *   - Sesiones y tokens temporales: refresh_tokens, password_reset_tokens, intentos_login
 *   - Sucursales y áreas operativas: areas, usuario_sucursales, historial_salarios, sucursales (se restaura la Sede Principal id=1)
 *
 * Conserva intactos:
 *   - roles, permisos, rol_permisos (RBAC completo)
 *   - superadmin (único usuario de acceso conservado)
 *   - empleado del superadmin (re-vinculado a la Sede Principal)
 *
 * Ejecución:
 *   deno task seed:clean
 *   o directamente:
 *   deno run --allow-net --allow-env --allow-read --allow-ffi --allow-run --env packages/database/src/seeds/limpiar-negocio.seed.ts
 */

import mysql from 'mysql2/promise';

const TABLAS_A_VACIAR = [
  // 1. Facturación, ventas y turnos
  'factura_items',
  'factura_pagos',
  'devoluciones_ventas',
  'facturas',
  'turnos_caja',
  'clientes',

  // 2. Inventario, catálogo y proveedores
  'movimientos_inventario',
  'inventario_sucursal',
  'productos',
  'proveedores',
  'categorias',

  // 3. Activos fijos y mantenimiento
  'mantenimientos_activos',
  'asignaciones_activos',
  'activos',
  'categorias_activos',

  // 4. Alertas y auditoría
  'alertas_admin',
  'logs_auditoria',
  'logs_mcp_tools',

  // 5. Tokens de sesión y seguridad operativa
  'refresh_tokens',
  'password_reset_tokens',
  'intentos_login',

  // 6. Áreas, historial y sucursales
  'areas',
  'usuario_sucursales',
  'historial_salarios',
  'sucursales',
];

export async function limpiarDatosNegocio(): Promise<void> {
  const host = Deno.env.get('DB_HOST') || 'localhost';
  const port = Number(Deno.env.get('DB_PORT') || 3306);
  const user = Deno.env.get('DB_USER') || 'warengine_user';
  const password = Deno.env.get('DB_PASSWORD') || '';
  const database = Deno.env.get('DB_NAME') || 'warengine';

  console.log('🧹 [Warengine] Conectando a la base de datos para limpieza...');
  console.log(`   Host: ${host}:${port} | BD: ${database} | Usuario: ${user}\n`);

  const conn = await mysql.createConnection({
    host,
    port,
    user,
    password,
    database,
  });

  try {
    // 1. Desactivar validación de Foreign Keys en la sesión actual
    console.log('⚙️  Desactivando verificación de foreign keys (SET FOREIGN_KEY_CHECKS = 0)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 0;');

    // 2. Truncar tablas operativas y de negocio
    console.log('\n🗑️  Vaciando tablas de negocio (TRUNCATE)...');
    for (const tabla of TABLAS_A_VACIAR) {
      try {
        await conn.query(`TRUNCATE TABLE \`${tabla}\`;`);
        console.log(`   ✔ ${tabla.padEnd(25)} [vaciada]`);
      } catch (err: unknown) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        console.warn(`   ⚠️  No se pudo vaciar "${tabla}": ${errorMsg}`);
      }
    }

    // 3. Restaurar la sucursal del sistema (id=1)
    console.log('\n🏢 Restaurando Sede Principal del sistema (id=1)...');
    await conn.query(`
      INSERT INTO sucursales (id_sucursal, nombre, direccion, contacto, is_active)
      VALUES (1, 'Sede Principal (Sistema)', 'Local', 'sistema@warengine.local', 1)
      ON DUPLICATE KEY UPDATE nombre = 'Sede Principal (Sistema)', is_active = 1;
    `);
    await conn.query('ALTER TABLE sucursales AUTO_INCREMENT = 2;');
    console.log('   ✔ Sede Principal (Sistema) lista. Próxima sucursal iniciará en ID 2.');

    // 4. Conservar únicamente superadmin y eliminar todos los demás usuarios y empleados
    console.log('\n👤 Limpiando usuarios y empleados (conservando solo superadmin)...');
    await conn.query(`
      DELETE FROM usuarios 
      WHERE email != 'superadmin@warengine.local'
        AND rol_id NOT IN (SELECT id_rol FROM roles WHERE nombre = 'super-admin');
    `);
    console.log('   ✔ Usuarios secundarios eliminados.');

    await conn.query(`
      DELETE FROM empleados 
      WHERE id_empleado NOT IN (SELECT empleado_id FROM usuarios);
    `);
    console.log('   ✔ Empleados eliminados (solo se conserva el empleado del superadmin).');

    await conn.query('UPDATE empleados SET sucursal_id = 1, area_id = NULL;');

    // 5. Reactivar verificación de Foreign Keys
    console.log('\n⚙️  Reactivando verificación de foreign keys (SET FOREIGN_KEY_CHECKS = 1)...');
    await conn.query('SET FOREIGN_KEY_CHECKS = 1;');

    // 6. Resumen de datos conservados y vaciados
    console.log('\n📊 Resumen del estado actual:');
    const [usuariosCount] = await conn.query('SELECT COUNT(*) as total FROM usuarios') as unknown as [[{ total: number }]];
    const [empleadosCount] = await conn.query('SELECT COUNT(*) as total FROM empleados') as unknown as [[{ total: number }]];
    const [rolesCount] = await conn.query('SELECT COUNT(*) as total FROM roles') as unknown as [[{ total: number }]];
    const [permisosCount] = await conn.query('SELECT COUNT(*) as total FROM permisos') as unknown as [[{ total: number }]];
    const [sucursalesCount] = await conn.query('SELECT COUNT(*) as total FROM sucursales') as unknown as [[{ total: number }]];
    const [productosCount] = await conn.query('SELECT COUNT(*) as total FROM productos') as unknown as [[{ total: number }]];
    const [proveedoresCount] = await conn.query('SELECT COUNT(*) as total FROM proveedores') as unknown as [[{ total: number }]];
    const [facturasCount] = await conn.query('SELECT COUNT(*) as total FROM facturas') as unknown as [[{ total: number }]];
    const [alertasCount] = await conn.query('SELECT COUNT(*) as total FROM alertas_admin') as unknown as [[{ total: number }]];

    console.log(`   - Usuarios conservados:    ${usuariosCount[0].total}`);
    console.log(`   - Empleados conservados:   ${empleadosCount[0].total}`);
    console.log(`   - Roles del sistema:       ${rolesCount[0].total}`);
    console.log(`   - Permisos del sistema:    ${permisosCount[0].total}`);
    console.log(`   - Sucursales (Sistema):    ${sucursalesCount[0].total}`);
    console.log(`   - Productos restantes:     ${productosCount[0].total}`);
    console.log(`   - Proveedores restantes:   ${proveedoresCount[0].total}`);
    console.log(`   - Facturas restantes:      ${facturasCount[0].total}`);
    console.log(`   - Alertas restantes:       ${alertasCount[0].total}`);

    console.log('\n✨ ¡Limpieza completada exitosamente! Tu base de datos quedó en blanco para operaciones de negocio sin perder tus usuarios y accesos.');
  } catch (error) {
    console.error('\n❌ Error durante la limpieza de la base de datos:', error);
    try {
      await conn.query('SET FOREIGN_KEY_CHECKS = 1;');
    } catch {
      // Ignorar si la conexión falló
    }
    throw error;
  } finally {
    await conn.end();
  }
}

// Ejecutar automáticamente si se invoca directo desde la CLI
limpiarDatosNegocio()
  .then(() => Deno.exit(0))
  .catch(() => Deno.exit(1));
