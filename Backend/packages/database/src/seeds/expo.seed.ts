/**
 * expo.seed.ts — Estado inicial limpio para la demo en vivo (deno task seed:expo).
 *
 * Deja la base con SOLO:
 *   - roles, permisos y sus asignaciones (seedAutenticacion)
 *   - la Sede Principal (id=1, reservada)
 *   - el usuario superadmin@warengine.local con su empleado, sin 2FA
 * Sin productos, clientes, facturas ni otros usuarios.
 *
 * SEGURIDAD:
 *  - TRUNCA tablas de negocio: exige confirmar escribiendo el nombre de la BD,
 *    o pasar `--yes --db=<DB_NAME>` (el nombre debe coincidir con DB_NAME).
 *  - La contraseña del super-admin sale SOLO de SEED_SUPERADMIN_PASSWORD (mín. 12); jamás se imprime.
 *
 * IDEMPOTENCIA: cada ejecución deja exactamente el mismo estado.
 *
 * Uso (desde Backend/):
 *   deno task seed:expo
 *   deno task seed:expo --yes --db=Warengine
 */

import { eq, sql } from 'drizzle-orm';
import { closeDatabase, getDatabase } from '../client.ts';
import { usuarios } from '../schema/autenticacion.schema.ts';
import { seedAutenticacion } from './autenticacion.seed.ts';
import { crearSuperAdminInicial } from './super-admin.seed.ts';
import { limpiarDatosNegocio } from './limpiar-negocio.seed.ts';

const SUPER_ADMIN_EMAIL = 'superadmin@warengine.local';

const TABLAS_RESUMEN = [
  'roles',
  'permisos',
  'rol_permisos',
  'sucursales',
  'usuarios',
  'empleados',
  'productos',
  'proveedores',
  'clientes',
  'facturas',
  'turnos_caja',
  'movimientos_inventario',
  'logs_auditoria',
];

function leerArgumento(nombre: string): string | undefined {
  const prefijo = `--${nombre}=`;
  return Deno.args.find((a) => a.startsWith(prefijo))?.slice(prefijo.length);
}

/** true si el operador confirmó explícitamente sobre la BD indicada. */
function confirmarBaseDeDatos(dbName: string): boolean {
  if (Deno.args.includes('--yes')) {
    const dbArg = leerArgumento('db');
    if (dbArg !== dbName) {
      console.error(
        `❌ Con --yes debes indicar --db=<nombre> y debe coincidir con DB_NAME (recibido: ${dbArg ?? 'nada'}).`,
      );
      return false;
    }
    return true;
  }

  if (!Deno.stdin.isTerminal()) {
    console.error('❌ No hay terminal interactiva para confirmar. Usa --yes --db=<DB_NAME>.');
    return false;
  }

  const respuesta = prompt(`Escribe el nombre de la base de datos (${dbName}) para confirmar:`);
  return respuesta?.trim() === dbName;
}

async function main(): Promise<number> {
  const dbName = Deno.env.get('DB_NAME');
  if (!dbName) {
    console.error('❌ DB_NAME no está definida. Revisa el archivo .env del Backend.');
    return 1;
  }
  const host = Deno.env.get('DB_HOST') || 'localhost';
  const port = Deno.env.get('DB_PORT') || '3306';

  console.log('🎤 [Warengine] seed:expo — estado inicial limpio para la demo');
  console.log(`   Destino: ${host}:${port} / BD "${dbName}"`);
  console.log('   ⚠️  Se VACIARÁN todas las tablas de negocio (facturas, inventario, clientes, usuarios...).\n');

  if (!confirmarBaseDeDatos(dbName)) {
    console.error('Operación cancelada. No se modificó nada.');
    return 1;
  }

  // Se valida antes de truncar para no dejar la BD sin super-admin
  const password = Deno.env.get('SEED_SUPERADMIN_PASSWORD');
  if (!password || password.length < 12) {
    console.error('❌ SEED_SUPERADMIN_PASSWORD falta o tiene menos de 12 caracteres. No se modificó nada.');
    return 1;
  }

  await limpiarDatosNegocio();

  const db = getDatabase();
  try {
    await seedAutenticacion(db);
    await crearSuperAdminInicial(db);

    // El super-admin entra por /acceso sin 2FA justo después del seed
    await db
      .update(usuarios)
      .set({ requiere_2fa: 0, totp_secret: null, is_active: 1 })
      .where(eq(usuarios.email, SUPER_ADMIN_EMAIL));

    console.log('\n📊 Resumen de seed:expo:');
    for (const tabla of TABLAS_RESUMEN) {
      const [filas] = (await db.execute(
        sql.raw(`SELECT COUNT(*) AS total FROM \`${tabla}\``),
      )) as unknown as [Array<{ total: number }>];
      console.log(`   - ${tabla.padEnd(24)} ${Number(filas[0]?.total ?? 0)}`);
    }

    console.log(`\n✅ Listo. Ingresa por /acceso con ${SUPER_ADMIN_EMAIL}.`);
    return 0;
  } finally {
    await closeDatabase();
  }
}

if (import.meta.main) {
  main()
    .then((codigo) => Deno.exit(codigo))
    .catch((error) => {
      console.error('❌ Error ejecutando seed:expo:', error instanceof Error ? error.message : error);
      Deno.exit(1);
    });
}
