# Persistencia y Base de Datos (`@warengine/database`)

Este documento describe la arquitectura de persistencia, conexión a MySQL, esquemas de Drizzle ORM, repositorios concretos y semillas de datos del paquete `Backend/packages/database`.

---

## 1. Arquitectura y Conexión

Warengine utiliza **Drizzle ORM** sobre el driver `mysql2/promise` para interactuar con MySQL 8. La persistencia opera como un adaptador de salida que implementa las interfaces de repositorios definidas en el dominio (`packages/core/src/modules/*/domain/repositories/`).

### Conexión Singleton y Zona Horaria UTC
Ubicación: [`Backend/packages/database/src/client.ts`](../../Backend/packages/database/src/client.ts)

```typescript
export function getDatabase(config?: DatabaseConfig): Database {
  // ...
  pool = mysql.createPool({
    host,
    port,
    user,
    password,
    database,
    timezone: 'Z',          // UTC estricto
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  dbInstance = drizzle(pool, { schema, mode: 'default' });
  return dbInstance;
}
```

- **Regla UTC Obligatoria (`timezone: 'Z'`):** Garantiza que todas las marcas de tiempo (`NOW()`, `CURRENT_TIMESTAMP`, `tokens_invalidados_en`) se almacenen y lean en UTC sin desfaces locales. Esto es crítico para comparar el claim `iat` (en segundos UTC) del token JWT contra la fecha de revocación en BD.
- **Pool de Conexiones:** Pool limitado a 10 conexiones simultáneas por instancia, gestionado de forma perezosa (lazy).
- **Cierre controlado:** `closeDatabase()` permite terminar el pool ordenadamente durante la ejecución de tests o apagado del proceso.

### Variables de Entorno de Conexión
| Variable | Valor por Defecto | Propósito |
| :--- | :---: | :--- |
| `DB_HOST` | `'localhost'` | Host del servidor MySQL. |
| `DB_PORT` | `3306` | Puerto de conexión a MySQL. |
| `DB_USER` | `'warengine_user'` | Usuario de la base de datos. |
| `DB_PASSWORD` | `''` | Contraseña de autenticación de MySQL. |
| `DB_NAME` | `'warengine'` | Nombre de la base de datos. |

---

## 2. Definición de Esquemas Drizzle (`src/schema/`)

Los esquemas reflejan fielmente las tablas de `Docs/database/WARENGINE_FULL_BD.sql`:

### 2.1 Tipo Personalizado `varcharBin`
Ubicación: [`Backend/packages/database/src/schema/column-types.ts`](../../Backend/packages/database/src/schema/column-types.ts)

```typescript
export const varcharBin = customType<{ data: string; config: { length: number } }>({
  dataType(config) {
    return `varchar(${config?.length ?? 255}) collate utf8mb4_bin`;
  },
});
```

Aplica la intercalación binaria `utf8mb4_bin` para forzar comparaciones byte a byte exactas en campos sensibles a mayúsculas/minúsculas y caracteres de seguridad:
- Hashes Argon2 (`password_hash`).
- Tokens y hashes SHA-256 (`token_hash` en refresh tokens).
- Secretos TOTP (`totp_secret_encrypted`).
- Códigos de permisos (`codigo` en tabla `permisos`).
- Códigos de identificación de negocio (`numero_documento` en clientes, `sku` en productos).

### 2.2 Archivos de Esquema por Módulo
| Archivo | Tablas Drizzle Declaradas |
| :--- | :--- |
| [`administracion.schema.ts`](../../Backend/packages/database/src/schema/administracion.schema.ts) | `sucursales`, `empleados`. |
| [`autenticacion.schema.ts`](../../Backend/packages/database/src/schema/autenticacion.schema.ts) | `usuarios`, `roles`, `permisos`, `rol_permisos`, `intentos_login`, `refresh_tokens`. |
| [`facturacion.schema.ts`](../../Backend/packages/database/src/schema/facturacion.schema.ts) | `clientes`. |
| [`inventario.schema.ts`](../../Backend/packages/database/src/schema/inventario.schema.ts) | `categorias`, `proveedores`. |
| [`auditoria.schema.ts`](../../Backend/packages/database/src/schema/auditoria.schema.ts) | `logs_auditoria`. |

---

## 3. Repositorios y Mappers

Los repositorios concretos implementan los puertos de `core` abstrayendo por completo Drizzle ORM del dominio:

```
Backend/packages/database/src/
├── mappers/
│   ├── administracion/  (empleado.mapper.ts, sucursal.mapper.ts)
│   ├── autenticacion/   (usuario.mapper.ts)
│   ├── facturacion/     (cliente.mapper.ts)
│   └── inventario/      (categoria.mapper.ts, proveedor.mapper.ts)
└── repositories/
    ├── administracion/  (drizzle-auditoria.repository.ts, drizzle-gestion-usuario.repository.ts, drizzle-sucursal.repository.ts)
    ├── autenticacion/   (drizzle-intento-login.repository.ts, drizzle-refresh-token.repository.ts, drizzle-rol.repository.ts, drizzle-usuario.repository.ts)
    ├── facturacion/     (drizzle-cliente.repository.ts)
    ├── inventario/      (drizzle-categoria.repository.ts, drizzle-proveedor.repository.ts)
    ├── logistica/       (.gitkeep)
    └── mcp-audit/       (.gitkeep)
```

- **Mappers puros:** Convierten filas de BD (`row`) a entidades de dominio y viceversa, manteniendo el tipado estricto sin incluir lógica de negocio.
- **Ubicación de Auditoría:** Nótese que `drizzle-auditoria.repository.ts` se ubica físicamente en `repositories/administracion/` aunque implementa `IAuditoriaRepository` del módulo transversal de auditoría.

---

## 4. Estado de Unit of Work y Transacciones

Ubicación: [`Backend/packages/database/src/unit-of-work.ts`](../../Backend/packages/database/src/unit-of-work.ts)

Actualmente es un **stub**:
```typescript
// TODO: implementar cuando se desarrolle el módulo de facturación.
```

- Las transacciones multi-tabla requeridas por los casos de uso atómicos de administración (ej. crear usuario + crear empleado) o el registro con reutilización de clientes se manejan actualmente a través de consultas coordinadas o transacciones locales en los propios repositorios/casos de uso.

---

## 5. Scripts de Semillas (Seeds)

Ubicación: `Backend/packages/database/src/seeds/`

1. [`autenticacion.seed.ts`](../../Backend/packages/database/src/seeds/autenticacion.seed.ts): Puebla los 7 roles del sistema, el catálogo completo de permisos de `@warengine/contracts`, y las asociaciones `rol_permisos` correspondientes.
2. [`super-admin.seed.ts`](../../Backend/packages/database/src/seeds/super-admin.seed.ts): Crea la sucursal principal ("Principal", activa) y el usuario Super Administrador inicial (`admin@warengine.com`), requiriendo obligatoriamente en desarrollo la variable `SEED_SUPERADMIN_PASSWORD`.
3. [`run.ts`](../../Backend/packages/database/src/seeds/run.ts): Orquestador CLI que ejecuta los seeds en orden (`deno run -A packages/database/src/seeds/run.ts`).

---

## 6. Drizzle Kit y Migraciones

Ubicación: [`Backend/packages/database/drizzle.config.ts`](../../Backend/packages/database/drizzle.config.ts)

- `drizzle-kit` corre bajo Node.js y lee variables de entorno vía `process.env`.
- La carpeta `migrations/` contiene únicamente un archivo `.gitkeep`. La base de datos se inicializa y estructura directamente desde el script SQL canónico `Docs/database/WARENGINE_FULL_BD.sql`.

---

## 7. Hallazgos y Discrepancias

1. **Inexistencia de `src/errors/mysql-error-translator.ts` y `mysql-error-messages.ts`:**
   - La documentación previa describía un traductor centralizado de errores MySQL. Dicho módulo **no existe**.
   - Los repositorios resuelven errores de forma local: por ejemplo, `drizzle-cliente.repository.ts` comprueba inline el código `errno === 1062` (`MYSQL_CLAVE_DUPLICADA`), mientras que otros repositorios capturan genéricamente o relanzan el error.
2. **Inexistencia de UnitOfWork operacional:** El archivo `unit-of-work.ts` no contiene código ejecutable.
