/**
 * super-admin.seed.ts — Crea el usuario super-admin inicial en entornos development.
 *
 * SEGURIDAD:
 *  - La contraseña se lee EXCLUSIVAMENTE de SEED_SUPERADMIN_PASSWORD.
 *  - Si la variable no está definida, el script aborta con error explícito.
 *  - Se aplica Argon2id (via argon2) antes de persistir — jamás se guarda en claro.
 *  - El proceso es idempotente: si ya existe el email, actualiza el hash (no duplica).
 *
 * DEPENDENCIA de negocio:
 *  - Un `usuario` requiere un `empleado` vinculado (FK: usuarios.empleado_id).
 *  - Por eso también se crea un empleado-sistema si no existe, con una
 *    sucursal-sistema (id_sucursal = 1). Esta sucursal debe existir en la BD
 *    o haberse creado antes con la migración de datos de producción.
 */

import * as argon2 from 'argon2';
import { eq } from 'drizzle-orm';
import { Database } from '../client.ts';
import { usuarios, roles } from '../schema/autenticacion.schema.ts';
import { empleados, sucursales } from '../schema/administracion.schema.ts';

const SEED_EMAIL = 'superadmin@warengine.local';

export async function crearSuperAdminInicial(db: Database): Promise<void> {
  console.log('\n🔐 Configurando super-admin inicial...');

  // 1. Leer contraseña de variable de entorno — NUNCA hardcodeada
  const password = Deno.env.get('SEED_SUPERADMIN_PASSWORD');
  if (!password) {
    throw new Error(
      '❌ SEED_SUPERADMIN_PASSWORD no está definida. ' +
      'Define esta variable de entorno antes de ejecutar el seed en development.'
    );
  }
  if (password.length < 12) {
    throw new Error(
      '❌ SEED_SUPERADMIN_PASSWORD debe tener al menos 12 caracteres.'
    );
  }

  // 2. Obtener rol super-admin
  const [rolSuperAdmin] = await db
    .select()
    .from(roles)
    .where(eq(roles.nombre, 'super-admin'))
    .limit(1);

  if (!rolSuperAdmin) {
    throw new Error('❌ Rol "super-admin" no encontrado. Ejecuta seedAutenticacion primero.');
  }

  // 3. Asegurar sucursal-sistema (id=1) — debe existir previamente en BD
  const [sucursalSistema] = await db
    .select()
    .from(sucursales)
    .where(eq(sucursales.id_sucursal, 1))
    .limit(1);

  if (!sucursalSistema) {
    // Crear sucursal-sistema si no existe (solo en desarrollo)
    await db.insert(sucursales).values({
      id_sucursal: 1,
      nombre: 'Sede Principal (Sistema)',
      direccion: 'Local',
      is_active: 1
    }).onDuplicateKeyUpdate({
      set: { nombre: 'Sede Principal (Sistema)' }
    });
    console.log('  ℹ️  Sucursal-sistema creada (id=1).');
  }

  // 4. Asegurar empleado-sistema para el super-admin
  const EMPLEADO_SISTEMA_DOC = 'SYS-001';
  let [empleadoSistema] = await db
    .select()
    .from(empleados)
    .where(eq(empleados.numero_documento, EMPLEADO_SISTEMA_DOC))
    .limit(1);

  if (!empleadoSistema) {
    await db.insert(empleados).values({
      tipo_documento: 'CC',
      numero_documento: EMPLEADO_SISTEMA_DOC,
      nombre: 'Super Administrador',
      cargo: 'Administrador del Sistema',
      sucursal_id: 1,
      fecha_ingreso: new Date().toISOString().split('T')[0]
    });

    [empleadoSistema] = await db
      .select()
      .from(empleados)
      .where(eq(empleados.numero_documento, EMPLEADO_SISTEMA_DOC))
      .limit(1);

    console.log('  ℹ️  Empleado-sistema creado.');
  }

  // 5. Hashear contraseña con Argon2id
  const passwordHash = await argon2.hash(password);

  // 6. Insertar usuario super-admin (idempotente via DUPLICATE KEY)
  await db.insert(usuarios).values({
    empleado_id: empleadoSistema.id_empleado,
    email: SEED_EMAIL,
    password_hash: passwordHash,
    rol_id: rolSuperAdmin.id_rol,
    is_active: 1,
    requiere_2fa: 0
  }).onDuplicateKeyUpdate({
    set: {
      password_hash: passwordHash,
      rol_id: rolSuperAdmin.id_rol,
      is_active: 1
    }
  });

  console.log(`  ✅ Super-admin listo: ${SEED_EMAIL}`);
  console.log('  ⚠️  Cambia la contraseña en el primer login de producción.');
}
