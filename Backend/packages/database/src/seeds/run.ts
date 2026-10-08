/**
 * run.ts — Script de arranque de datos iniciales de Warengine.
 *
 * Usos:
 *   deno run --allow-env --allow-net packages/database/src/seeds/run.ts
 *   NODE_ENV=development deno run ... (también crea usuario super-admin inicial)
 *
 * SEGURIDAD: La contraseña del super-admin NUNCA está hardcodeada.
 * Se toma de la variable de entorno SEED_SUPERADMIN_PASSWORD.
 * Si no existe en modo development, el script falla con un error claro.
 */

import { getDatabase, closeDatabase } from '../client.ts';
import { seedAutenticacion } from './autenticacion.seed.ts';
import { crearSuperAdminInicial } from './super-admin.seed.ts';

async function main() {
  console.log('🌱 Iniciando seeds de Warengine...');

  const db = getDatabase();

  try {
    // Paso 1: Roles, permisos y asignaciones (siempre idempotente)
    await seedAutenticacion(db);

    // Paso 2: Solo en entorno development, crear el super-admin inicial
    const env = Deno.env.get('NODE_ENV') ?? 'production';
    if (env === 'development') {
      await crearSuperAdminInicial(db);
    } else {
      console.log('ℹ️  Modo producción: omitiendo creación de super-admin inicial.');
    }

    console.log('\n✅ Seeds completados exitosamente.');
  } catch (error) {
    console.error('❌ Error ejecutando seeds:', error);
    Deno.exit(1);
  } finally {
    await closeDatabase();
  }
}

main();
