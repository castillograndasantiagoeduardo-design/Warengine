import { type Database } from '../client.ts';
import { permisos, rol_permisos, roles, usuarios } from '../schema/autenticacion.schema.ts';
import { eq, sql } from 'drizzle-orm';

const ROLES = [
  {
    id_rol: 1,
    nombre: 'super-admin',
    descripcion: 'Propietario / SuperAdmin del sistema con visión global',
  },
  { id_rol: 2, nombre: 'admin-sucursal', descripcion: 'Administrador de Almacén y de Sucursal' },
  { id_rol: 3, nombre: 'cajero-vendedor', descripcion: 'Cajero y Vendedor B2B' },
];

const PERMISOS = [
  // Módulo: Autenticación
  {
    id_permiso: 1,
    codigo: 'autenticacion:gestionar-usuarios',
    modulo: 'autenticacion',
    descripcion: 'Crear o desactivar usuarios, resetear credenciales',
  },
  {
    id_permiso: 2,
    codigo: 'autenticacion:asignar-roles',
    modulo: 'autenticacion',
    descripcion: 'Asignar roles a usuarios',
  },
  {
    id_permiso: 3,
    codigo: 'autenticacion:ver-auditoria',
    modulo: 'autenticacion',
    descripcion: 'Ver auditoría de logins e intentos fallidos',
  },

  // Módulo: Inventario
  {
    id_permiso: 4,
    codigo: 'inventario:leer',
    modulo: 'inventario',
    descripcion: 'Consultar catálogo, precios y stock',
  },
  {
    id_permiso: 5,
    codigo: 'inventario:escribir',
    modulo: 'inventario',
    descripcion: 'Crear/editar productos, categorías y proveedores',
  },
  {
    id_permiso: 6,
    codigo: 'inventario:registrar-movimiento',
    modulo: 'inventario',
    descripcion: 'Registrar compras y salidas manuales',
  },
  {
    id_permiso: 7,
    codigo: 'inventario:ajustar-stock',
    modulo: 'inventario',
    descripcion: 'Realizar ajustes de inventario',
  },
  {
    id_permiso: 8,
    codigo: 'inventario:ver-kardex',
    modulo: 'inventario',
    descripcion: 'Ver historial de movimientos de inventario',
  },

  // Módulo: Facturación
  {
    id_permiso: 9,
    codigo: 'facturacion:facturar',
    modulo: 'facturacion',
    descripcion: 'Abrir/cerrar turnos, emitir facturas y cobrar',
  },
  {
    id_permiso: 10,
    codigo: 'facturacion:anular',
    modulo: 'facturacion',
    descripcion: 'Anular facturas emitidas',
  },
  {
    id_permiso: 11,
    codigo: 'facturacion:devolucion',
    modulo: 'facturacion',
    descripcion: 'Registrar devoluciones de ventas',
  },
  {
    id_permiso: 12,
    codigo: 'facturacion:consultar',
    modulo: 'facturacion',
    descripcion: 'Ver histórico de facturas y turnos',
  },
  {
    id_permiso: 13,
    codigo: 'facturacion:gestionar-clientes',
    modulo: 'facturacion',
    descripcion: 'Crear y editar información de clientes',
  },

  // Módulo: Administración
  {
    id_permiso: 14,
    codigo: 'administracion:gestionar-sucursales',
    modulo: 'administracion',
    descripcion: 'Crear y configurar sucursales y áreas',
  },
  {
    id_permiso: 15,
    codigo: 'administracion:gestionar-personal',
    modulo: 'administracion',
    descripcion: 'Crear empleados y asignar sucursales',
  },
  {
    id_permiso: 16,
    codigo: 'administracion:gestionar-salarios',
    modulo: 'administracion',
    descripcion: 'Registrar cambios salariales',
  },
  {
    id_permiso: 17,
    codigo: 'administracion:ver-metricas-sucursal',
    modulo: 'administracion',
    descripcion: 'Ver métricas de la propia sucursal',
  },
  {
    id_permiso: 18,
    codigo: 'administracion:ver-metricas-globales',
    modulo: 'administracion',
    descripcion: 'Ver dashboard financiero de todas las sucursales',
  },
  {
    id_permiso: 19,
    codigo: 'administracion:gestionar-alertas',
    modulo: 'administracion',
    descripcion: 'Ver y atender alertas administrativas',
  },

  // Módulo: Logística
  {
    id_permiso: 20,
    codigo: 'logistica:leer',
    modulo: 'logistica',
    descripcion: 'Consultar catálogo y estado de activos',
  },
  {
    id_permiso: 21,
    codigo: 'logistica:gestionar-activos',
    modulo: 'logistica',
    descripcion: 'Registrar y editar activos fijos',
  },
  {
    id_permiso: 22,
    codigo: 'logistica:asignar-activos',
    modulo: 'logistica',
    descripcion: 'Asignar y recibir activos',
  },
  {
    id_permiso: 23,
    codigo: 'logistica:mantenimiento',
    modulo: 'logistica',
    descripcion: 'Registrar mantenimientos de activos',
  },

  // Módulo: MCP
  {
    id_permiso: 24,
    codigo: 'mcp:consultar',
    modulo: 'mcp',
    descripcion: 'Ejecutar tools de consulta conversacional',
  },
  {
    id_permiso: 25,
    codigo: 'mcp:ejecutar-herramientas',
    modulo: 'mcp',
    descripcion: 'Ejecutar tools operativas automatizadas',
  },
  {
    id_permiso: 26,
    codigo: 'mcp:herramientas-financieras',
    modulo: 'mcp',
    descripcion: 'Ejecutar tools analíticas globales',
  },
];

const PERMISOS_LOGISTICA = [
  'logistica:leer',
  'logistica:gestionar-activos',
  'logistica:asignar-activos',
  'logistica:mantenimiento',
];

const ASIGNACIONES: Record<string, string[]> = {
  'cajero-vendedor': [
    'inventario:leer',
    'facturacion:facturar',
    'facturacion:consultar',
    'facturacion:gestionar-clientes',
    'logistica:leer',
    'mcp:consultar',
  ],
  'admin-sucursal': [
    'inventario:leer',
    'inventario:escribir',
    'inventario:registrar-movimiento',
    'inventario:ajustar-stock',
    'inventario:ver-kardex',
    'facturacion:facturar',
    'facturacion:consultar',
    'facturacion:gestionar-clientes',
    'facturacion:anular',
    'facturacion:devolucion',
    'administracion:gestionar-personal',
    'administracion:ver-metricas-sucursal',
    'administracion:gestionar-alertas',
    ...PERMISOS_LOGISTICA,
    'mcp:consultar',
    'mcp:ejecutar-herramientas',
  ],
  'super-admin': PERMISOS.map((p) => p.codigo),
};

export async function seedAutenticacion(db: Database) {
  // 1. Limpieza preventiva del rol obsoleto 'admin-logistica' si existiera en la BD
  const rolesExistentes = await db.select().from(roles);
  const rolLogistica = rolesExistentes.find((r) => r.nombre === 'admin-logistica');
  const rolAdminSucursal = rolesExistentes.find((r) => r.nombre === 'admin-sucursal');

  if (rolLogistica) {
    if (rolAdminSucursal) {
      // Migrar usuarios que pudieran tener admin-logistica hacia admin-sucursal para respetar FK restrict
      await db
        .update(usuarios)
        .set({ rol_id: rolAdminSucursal.id_rol })
        .where(eq(usuarios.rol_id, rolLogistica.id_rol));
    }

    // Eliminar asignaciones de permisos del rol obsoleto
    await db.delete(rol_permisos).where(eq(rol_permisos.rol_id, rolLogistica.id_rol));

    // Eliminar el rol de la BD
    await db.delete(roles).where(eq(roles.id_rol, rolLogistica.id_rol));

    console.log('🧹 Rol obsoleto "admin-logistica" eliminado y dependencias depuradas.');
  }

  // 2. Roles vigentes
  await db.insert(roles).values(ROLES).onDuplicateKeyUpdate({
    set: {
      nombre: sql`VALUES(nombre)`,
      descripcion: sql`VALUES(descripcion)`,
    },
  });

  // 3. Permisos
  await db.insert(permisos).values(PERMISOS).onDuplicateKeyUpdate({
    set: {
      codigo: sql`VALUES(codigo)`,
      modulo: sql`VALUES(modulo)`,
      descripcion: sql`VALUES(descripcion)`,
    },
  });

  // 4. Obtener IDs mapeados vigentes
  const rolesDb = await db.select().from(roles);
  const permisosDb = await db.select().from(permisos);

  const rolesMap = new Map(rolesDb.map((r) => [r.nombre, r.id_rol]));
  const permisosMap = new Map(permisosDb.map((p) => [p.codigo, p.id_permiso]));

  // 5. Asignaciones de permisos (idempotente)
  const relaciones = [];
  for (const [nombreRol, codigosPermisos] of Object.entries(ASIGNACIONES)) {
    const rolId = rolesMap.get(nombreRol);
    if (!rolId) continue;

    for (const codigo of codigosPermisos) {
      const permisoId = permisosMap.get(codigo);
      if (permisoId) {
        relaciones.push({ rol_id: rolId, permiso_id: permisoId });
      }
    }
  }

  // Insertar ignorando duplicados (la PK evita duplicidad)
  if (relaciones.length > 0) {
    await db.insert(rol_permisos).values(relaciones).onDuplicateKeyUpdate({
      set: {
        rol_id: sql`VALUES(rol_id)`,
      },
    });
  }

  console.log('✅ Seed de Autenticación completado exitosamente.');
}

