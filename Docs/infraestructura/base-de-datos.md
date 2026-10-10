# Infraestructura — Base de Datos (`@warengine/database`)

> **Propósito y estado:** **IMPLEMENTADO** (Persistencia con Drizzle ORM sobre MySQL 8; Unit of Work pendiente)  
> **Ubicación:** `Backend/packages/database/`  
> **Arquitectura:** Clean Architecture + Ports & Adapters + ADR 0001 (Regla 4)

---

## 1. Propósito

El paquete `@warengine/database` implementa los puertos de persistencia (repositorios) definidos por el dominio en `@warengine/core`. Encapsula el cliente de conexión a MySQL 8 mediante Drizzle ORM, la definición de esquemas de tablas, los mapeadores entidad-relacional, los scripts de inicialización de datos (seeds) y la traducción de errores de bajo nivel del motor relacional hacia códigos entendibles por el dominio.

---

## 2. Mapa de Archivos

```
Backend/packages/database/
├── README.md
├── deno.json
├── drizzle.config.ts              # Configuración de Drizzle Kit (utiliza process.env)
├── mod.ts                         # Re-exporta cliente, repositorios y esquemas
└── src/
    ├── client.ts                  # Pool de conexiones mysql2 y cliente Drizzle singleton
    ├── unit-of-work.ts            # Stub pendiente para transacciones multi-tabla
    ├── errors/
    │   └── mysql-error-translator.ts # Detección de errno de MySQL (1062, 1452, 1644, 3819)
    ├── schema/
    │   ├── index.ts               # Exportación centralizada del esquema Drizzle
    │   ├── column-types.ts        # Tipo personalizado varcharBin (COLLATE utf8mb4_bin)
    │   ├── administracion.schema.ts # sucursales, areas, empleados, usuario_sucursales, etc.
    │   ├── auditoria.schema.ts    # logs_auditoria, logs_mcp_tools
    │   ├── autenticacion.schema.ts# roles, permisos, rol_permisos, usuarios, refresh_tokens, intentos_login
    │   ├── facturacion.schema.ts  # clientes, facturas, factura_items, factura_pagos, devoluciones
    │   ├── inventario.schema.ts   # categorias, proveedores, productos, inventario_sucursal, movimientos
    │   └── turnos-caja.schema.ts  # turnos_caja
    ├── mappers/
    │   ├── administracion/
    │   │   ├── log-auditoria.mapper.ts
    │   │   ├── sucursal.mapper.ts
    │   │   └── usuario-gestionado.mapper.ts
    │   ├── autenticacion/
    │   │   └── usuario.mapper.ts
    │   ├── facturacion/
    │   │   ├── cliente.mapper.ts
    │   │   └── turno-caja.mapper.ts
    │   └── inventario/
    │       ├── categoria.mapper.ts
    │       ├── producto.mapper.ts
    │       └── proveedor.mapper.ts
    ├── repositories/
    │   ├── administracion/
    │   │   ├── drizzle-auditoria.repository.ts
    │   │   ├── drizzle-gestion-usuario.repository.ts
    │   │   ├── drizzle-sucursal.repository.ts
    │   │   └── drizzle-usuario-sucursal.repository.ts
    │   ├── autenticacion/
    │   │   ├── drizzle-intento-login.repository.ts
    │   │   ├── drizzle-refresh-token.repository.ts
    │   │   ├── drizzle-rol.repository.ts
    │   │   └── drizzle-usuario.repository.ts
    │   ├── facturacion/
    │   │   ├── drizzle-cliente.repository.ts
    │   │   ├── drizzle-sucursal-operador.repository.ts
    │   │   └── drizzle-turno-caja.repository.ts
    │   ├── inventario/
    │   │   ├── drizzle-categoria.repository.ts
    │   │   ├── drizzle-producto.repository.ts
    │   │   └── drizzle-proveedor.repository.ts
    │   ├── logistica/.gitkeep
    │   └── mcp-audit/.gitkeep
    └── seeds/
        ├── autenticacion.seed.ts  # Inserción idempotente de roles, permisos y asignaciones
        ├── super-admin.seed.ts    # Creación inicial del usuario SuperAdmin
        └── run.ts                 # Orquestador de seeds (deno task seed / seed:dev)
```

---

## 3. Componentes y Responsabilidades

### 3.1 Cliente de Base de Datos ([client.ts](../../Backend/packages/database/src/client.ts))
Gestiona el ciclo de vida del pool de conexiones:
- Singleton `getDatabase(config?)`: Inicializa `mysql.createPool` con:
  - `timezone: 'Z'`: **Regla crítica 7.3**. Fuerza UTC estricto para evitar fallas en la comparación horaria de `tokens_invalidados_en` frente a `iat` del JWT.
  - `connectionLimit: 10`: Límite conservador para evitar saturación de conexiones en MySQL.
  - `waitForConnections: true` y `queueLimit: 0`.
- Envoltura Drizzle: `drizzle(pool, { schema, mode: 'default' })`.
- `closeDatabase()`: Finaliza el pool de conexiones (requerido para finalizar tests y cierres limpios).

### 3.2 Tipo de Columna Personalizada ([column-types.ts](../../Backend/packages/database/src/schema/column-types.ts))
- **`varcharBin`**: Genera columnas `VARCHAR(n) COLLATE utf8mb4_bin`. Es obligatorio para hashes de contraseña, hashes de refresh tokens, claves foráneas sensibles y códigos de permisos, asegurando comparación binaria exacta sensible a mayúsculas y acentos.

### 3.3 Traductor de Errores de MySQL ([mysql-error-translator.ts](../../Backend/packages/database/src/errors/mysql-error-translator.ts))
Centraliza la inspección de errores arrojados por el driver `mysql2`:
- `MYSQL_ERRNO`:
  - `1062` (`CLAVE_DUPLICADA`) -> Traduce a `SkuDuplicadoError`, `EmailYaRegistradoError`, etc.
  - `1452` (`FK_NO_REFERENCIADA`) -> Traduce a `ReferenciaInvalidaError`.
  - `1644` (`SIGNAL_TRIGGER`) / `3819` (`CHECK_VIOLADO`) -> Detección de rechazos impuestos por triggers o restricciones de tabla.
  - `1213` (`DEADLOCK`) y `1205` (`LOCK_WAIT_TIMEOUT`).
- `escaparLike(texto)`: Escapa caracteres `%` y `_` para evitar inyecciones en consultas `LIKE`.

### 3.4 Unit of Work ([unit-of-work.ts](../../Backend/packages/database/src/unit-of-work.ts))
- **Estado real en el código:** **Stub / Pendiente**. Contiene únicamente un comentario de diseño:
  `// TODO: implementar cuando se desarrolle el módulo de facturación.`
  Las transacciones actuales (como crear usuario con empleado) se ejecutan directamente mediante `db.transaction()` dentro del repositorio concreto.

### 3.5 Seeds de Inicialización ([seeds/](../../Backend/packages/database/src/seeds/))
- **`autenticacion.seed.ts`**:
  1. Depura preventivamente el rol en desuso `admin-logistica` si existiera.
  2. Inserta o actualiza los 3 roles vigentes (`super-admin`, `admin-sucursal`, `cajero-vendedor`).
  3. Inserta los 26 permisos institucionales.
  4. Asigna los permisos a cada rol de forma idempotente (`onDuplicateKeyUpdate`).
- **`super-admin.seed.ts`**: Inserta la primera sucursal ("Sucursal Central"), el primer empleado ("Super", "Admin") y la cuenta Super Admin activa con la contraseña leída de `SEED_SUPERADMIN_PASSWORD`.
- **`run.ts`**: Ejecuta `seedAutenticacion(db)` siempre; si `NODE_ENV === 'development'`, ejecuta adicionalmente `crearSuperAdminInicial(db)`.

---

## 4. Variables de Entorno

| Variable | Valor por Defecto | Consumidor | Obligatoria | Propósito |
|---|---|---|---|---|
| `DB_HOST` | `'localhost'` | `client.ts` | No | Dirección del servidor MySQL 8 |
| `DB_PORT` | `3306` | `client.ts` | No | Puerto de escucha de MySQL |
| `DB_USER` | `'warengine_user'` | `client.ts` | No | Usuario de conexión a la BD |
| `DB_PASSWORD` | `''` | `client.ts` | No | Contraseña de autenticación de MySQL |
| `DB_NAME` | `'warengine'` | `client.ts` | No | Nombre de la base de datos relacional |
| `NODE_ENV` | `'production'` | `seeds/run.ts` | No | Si es `'development'`, habilita la creación del Super Admin inicial |
| `SEED_SUPERADMIN_PASSWORD` | Ninguno | `seeds/super-admin.seed.ts` | Condicional | Contraseña inicial (mínimo 12 chars). Obligatoria si se corre `deno task seed:dev` |

---

## 5. Reglas Arquitectónicas y Dependencias Reales

1. **Principio de Inversión de Dependencias (ADR 0001, Reglas 3 y 4):**
   - `@warengine/core` **no depende** de `@warengine/database`. No existe ningún import de Drizzle ni de SQL en `core`.
   - `@warengine/database` depende de `@warengine/core` para implementar sus interfaces de repositorio.
2. **Dependencias reales del paquete:**
   - `drizzle-orm` (queries tipadas)
   - `mysql2` (driver de conexión con soporte para promesas)
   - `@warengine/core` (interfaces de repositorio, entidades)
   - `@warengine/shared-kernel` (Result, DomainError, Pagination)

---

## 6. Pendientes y Deuda Técnica

1. **Implementación de `UnitOfWork`:** Crear el adaptador transaccional para coordinar múltiples repositorios en una sola transacción sin acoplar los casos de uso a `db.transaction()` de Drizzle.
2. **Esquema Drizzle para Logística:** Crear `logistica.schema.ts` para mapear `activos`, `asignaciones_activos` y `mantenimientos_activos`.
3. **Flujo de Migraciones Automáticas:** El proyecto cuenta con `drizzle.config.ts`, pero no tiene generadas las carpetas de migraciones Drizzle (`migrations/` solo tiene `.gitkeep`), dependiendo del script SQL manual [Docs/database/WARENGINE_FULL_BD.sql](../../Docs/database/WARENGINE_FULL_BD.sql).
