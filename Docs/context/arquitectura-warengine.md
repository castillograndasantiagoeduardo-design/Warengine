# Arquitectura del Sistema Warengine — Documento de Contexto y Referencia

> **Documento de Contexto Técnico para Desarrolladores y Asistentes de IA**  
> **Versión:** 2.1  
> **Última actualización:** Octubre 2026  
> **Estado:** Activo / Vigente

---

## 1. Visión General del Sistema

**Warengine** es un sistema integral de **Planificación de Recursos Empresariales (ERP)** y **Punto de Venta (POS)** diseñado para cadenas comerciales con operación omnicanal (venta minorista B2C en mostrador y venta corporativa B2B a crédito o contado), gestión de inventario multi-sucursal y control de activos.

### Principios Fundamentales de Diseño
1. **Clean Architecture (Puertos y Adaptadores):** Separación estricta entre las reglas de negocio del dominio y los detalles técnicos de infraestructura (bases de datos, frameworks web, protocolos).
2. **Domain-Driven Design (DDD Táctico):** Organización por contextos delimitados (*Bounded Contexts*), agregados, entidades con identidad única, *Value Objects* inmutables, repositorios y casos de uso atómicos.
3. **Type-Safety End-to-End:** Tipado estricto con TypeScript en backend y frontend, validando los contratos con esquemas **Zod** compartidos.
4. **Manejo Monádico de Errores (`Result<T, DomainError>`):** Las fallas esperadas de negocio nunca lanzan excepciones (`throw`), sino que se modelan y propagan explícitamente a través del tipo `Result`.
5. **Defensa en Profundidad:** Las reglas de integridad críticas (saldo de stock, inmutabilidad del kardex, unicidad de turno de caja abierto por usuario) están blindadas tanto a nivel de aplicación (casos de uso) como a nivel de base de datos (triggers y restricciones SQL).

---

## 2. Topología del Monorepo y Capas (ADR 0001)

El proyecto está estructurado como un monorepo que separa claramente responsabilidades:

```
WARENGINEE/
├── Warengine/
│   ├── Backend/                       # Runtime Deno con TypeScript
│   │   ├── apps/
│   │   │   ├── api/                   # Primario: API REST Hono (HTTP/JSON)
│   │   │   └── mcp-server/            # Primario: Servidor Model Context Protocol para IA
│   │   ├── packages/
│   │   │   ├── shared-kernel/         # Primitivas puras (Result, DomainError, Entity...)
│   │   │   ├── core/                  # Dominio puro y casos de uso (DDD)
│   │   │   ├── database/              # Drizzle ORM, MySQL 8, migraciones y repositorios
│   │   │   ├── platform/              # Servicios técnicos (JWT, Argon2, Mailer, Config)
│   │   │   └── composition/           # Composition Root (Inyección de dependencias pura)
│   │   └── deno.json                  # Workspace Deno y tareas automatizadas
│   ├── Shared/
│   │   └── contracts/                 # Esquemas Zod y DTOs compartidos (Front & Back)
│   ├── Frontend/                      # SPA / SSR con Next.js 16 (App Router)
│   ├── Docs/                          # Especificaciones de negocio, ADRs, esquemas SQL
│   └── Http/                          # Archivos .http de prueba de integración funcional
```

### Reglas Estrictas de Dependencia (ADR 0001)

```
        ┌──────────────────┐
        │  shared-kernel   │ ◄── (Cero dependencias)
        └────────┬─────────┘
                 ▲
        ┌────────┴─────────┐
        │ Shared/contracts │ ◄── (Solo depende de Zod)
        └────────┬─────────┘
                 ▲
        ┌────────┴─────────┐
        │       core       │ ◄── (Reglas de negocio puras; NUNCA importa Drizzle ni HTTP)
        └────────┬─────────┘
          ▲             ▲
          │             │
  ┌───────┴──────┐ ┌────┴────────┐
  │   database   │ │  platform   │ ◄── (Implementan interfaces/puertos de core)
  └───────┬──────┘ └────┬────────┘
          ▲             ▲
          └──────┬──────┘
                 │
        ┌────────┴─────────┐
        │   composition    │ ◄── (Composition Root: conecta core con database y platform)
        └────────┬─────────┘
          ▲             ▲
     ┌────┴────┐   ┌────┴─────────┐
     │ apps/api│   │apps/mcp-server│ ◄── (Solo consumen casos de uso desde composition)
     └─────────┘   └──────────────┘
```

| Capa / Paquete | Qué CONTIENE | Qué TIENE PROHIBIDO |
| :--- | :--- | :--- |
| **`shared-kernel`** | `Result<T,E>`, `DomainError`, `Entity`, `ValueObject`, `Money`, `Clock`, `Pagination`, `ids`. | Importar cualquier librería externa o paquete del monorepo. |
| **`contracts`** | DTOs tipados, esquemas Zod de entrada/salida, enums de permisos y roles, catálogos. | Lógica de negocio (ej. cálculos de impuestos o validación de saldos de stock). |
| **`core`** | Entidades de dominio, reglas de negocio, puertos (`IRepository`, `IAuditor`, `IUnitOfWork`), casos de uso. | Importar Drizzle, SQL, Hono, JWT, Argon2, fetch o cualquier detalle de infraestructura. |
| **`database`** | Esquemas Drizzle, mappers entidad-fila, implementaciones de repositorios, seeds, transacciones MySQL2. | Ejecutar lógica de dominio fuera de la persistencia de datos. |
| **`platform`** | Implementaciones de hashing (Argon2id), tokens (JWT HS256), variables de entorno tipadas, utilidades técnicas. | Conocer conceptos de negocio del ERP. |
| **`composition`** | `createContainer(env)`: conecta repositorios, servicios y casos de uso en un contenedor singleton puro. | Alojar lógica de negocio; solo ensambla dependencias. |
| **`apps/api`** | Enrutadores Hono, controladores HTTP, middleware de autenticación y RBAC, presentadores de respuesta. | Importar repositorios, Drizzle o ejecutar queries SQL directamente. |
| **`Frontend`** | Interfaz Next.js 16, componentes React, llamadas fetch tipadas contra la API. | Importar nada de `Backend` (solo consume `Shared/contracts`). |

---

## 3. Módulos de Dominio (Bounded Contexts)

### 3.1. Autenticación y Autorización (`autenticacion`)
- **Mecanismo:** JWT firmado con HMAC-SHA256 (`HS256`). Access token de corta duración + Refresh token de rotación segura persistido en MySQL.
- **Control de Acceso (RBAC Granular):**
  - **Roles:** `super-admin` (visión global), `admin-sucursal` (gestión local), `cajero` (operación POS), `vendedor-b2b` (ventas corporativas).
  - **Permisos:** Formato estándar `modulo:accion` (ej. `inventario:crear-producto`, `facturacion:emitir-factura`).
- **Seguridad y Auditoría:**
  - Hasheo de contraseñas con **Argon2id**.
  - Política de bloqueo automático tras 5 intentos fallidos con backoff progresivo (persiste en `intentos_login`).
  - Columna `tokens_invalidados_en` en `usuarios` para invalidar tokens emitidos antes de cambios de contraseña o desactivaciones.
  - Sede Principal obligatoria: Cada usuario requiere un `empleado` asociado, y este a una `sucursal` base.

### 3.2. Administración (`administracion`)
- **Sucursales:** Puntos de venta físicos y bodegas. La **Sede Principal (id=1)** es la raíz de control del sistema.
- **Áreas:** Sub-unidades operativas dentro de una sucursal (Caja, Bodega, Despacho, etc.).
- **Empleados:** Personal contractual ligado a un área y sucursal.
- **Historial de Salarios:** Seguimiento auditable de incrementos o modificaciones de sueldo con fecha y usuario responsable.
- **Alertas Administrativas (`alertas_admin`):** Registro de incidentes con prioridad (`normal` / `urgente`) y estado (`pendiente`, `visto`, `atendido`).
- **Dashboard Analítico:** Métricas consolidadas en tiempo real (ganancias netas, tendencias temporales, rendimiento por sucursal y ranking de rotación de productos).

### 3.3. Auditoría Transversal (`auditoria`) — ADR 0002
- **Puerto Único:** `IAuditor.registrar(evento: EventoAuditoria): Promise<void>`.
- **Estructura de Cambios:** Convención estricta `{ antes: {...}, despues: {...} }` que registra exclusivamente los campos mutados.
- **Sanitización Obligatoria:** Función pura `sanitizarDetalles` que purga contraseñas, hashes, tokens JWT o secretos TOTP antes de persistir.
- **Inmutabilidad:** La tabla `logs_auditoria` está protegida por triggers SQL (`trg_logs_auditoria_bloquea_update` y `trg_logs_auditoria_bloquea_delete`) que prohíben cualquier modificación o borrado posterior.

### 3.4. Inventario y Catálogo Maestro (`inventario`)
- **Catálogo Global:**
  - `categorias`: Clasificación taxonómica de productos.
  - `proveedores`: Entidades proveedoras con datos de contacto.
  - `productos`: Catálogo maestro con `sku` único, `precio_compra`, `precio_venta` y `precio_corporativo`.
- **Existencias Multi-Sucursal (`inventario_sucursal`):**
  - El catálogo es global, pero el stock es por sucursal (`stock_actual`, `stock_minimo`).
- **Kardex Append-Only (`movimientos_inventario`):**
  - Registro inmutable de entradas (`entrada`), salidas (`salida`) y ajustes (`ajuste_entrada`, `ajuste_salida`).
  - Blindado en MySQL mediante `trg_movimientos_bloquea_update` y `trg_movimientos_bloquea_delete`.
- **Importación Masiva (RF-ADM-B20):**
  - `ImportarProductosUseCase`: Ingesta y validación atómica por CSV con soporte a delimitadores `,` y `;`, reporte fila a fila de éxitos y rechazos, y auditoría consolidada.

### 3.5. Facturación y Ventas (`facturacion`)
- **Clientes:**
  - **B2C:** Consumidor final (requiere CC, nombre; teléfono y email opcionales).
  - **B2B:** Cliente corporativo (requiere NIT/RUT, nombre, dirección y teléfono obligatorios para efectos fiscales).
- **Turnos de Caja (`turnos_caja`):**
  - Requisito obligatorio para ventas de mostrador B2C.
  - Regla: Un cajero solo puede tener **un turno abierto simultáneamente** en el sistema (controlado por índice único sobre columna generada en MySQL).
  - Arqueo de caja al cierre con cálculo automático de diferencia (`fondo_final - (fondo_inicial + total_ventas_efectivo)`).
- **Emisión de Facturas (`facturas`, `factura_items`, `factura_pagos`):**
  - **Venta Mostrador:** Asocia cliente B2C + turno de caja abierto + medios de pago (efectivo, tarjeta, transferencia).
  - **Venta B2B:** Exenta de turno de caja; si se utiliza `credito_corporativo`, valida que el cliente tenga `credito_habilitado = 1`.
  - **Validación de Pago Exacto:** La suma de `factura_pagos.monto` debe coincidir exactamente con el `total` facturado.
  - **Descargo de Inventario:** La inserción de ítems dispara automáticamente la reducción de stock y la creación del movimiento en kardex mediante triggers de base de datos.

### 3.6. Logística y Activos Fijos (`logistica`)
- Catálogo de activos de la empresa (`activos`), clasificación (`categorias_activos`), hoja de vida con trazabilidad de asignación a empleados/áreas (`asignaciones_activos`) y registro de mantenimientos preventivos/correctivos (`mantenimientos_activos`).

### 3.7. Agente MCP Server (`apps/mcp-server`)
- Expone herramientas funcionales (Tools) para asistentes inteligentes basados en el protocolo **Model Context Protocol (MCP)**.
- Reutiliza exactamente los mismos casos de uso del `AppContainer` sin duplicar lógica de negocio ni de validación.

---

## 4. Base de Datos: Esquema y Triggers de Integridad

El motor utilizado es **MySQL 8.0** con almacenamiento **InnoDB**.

### Triggers Críticos de Integridad

| Trigger | Tabla | Evento | Responsabilidad |
| :--- | :--- | :--- | :--- |
| `trg_factura_items_check_stock` | `factura_items` | BEFORE INSERT | Impide la venta si `stock_actual < cantidad`. |
| `trg_factura_items_genera_salida` | `factura_items` | AFTER INSERT | Inserta automáticamente el movimiento de salida en el kardex. |
| `trg_movimientos_actualiza_stock` | `movimientos_inventario` | AFTER INSERT | Suma o resta el `stock_actual` en `inventario_sucursal`. |
| `trg_movimientos_bloquea_update` | `movimientos_inventario` | BEFORE UPDATE | Bloquea mutaciones (kardex append-only). |
| `trg_movimientos_bloquea_delete` | `movimientos_inventario` | BEFORE DELETE | Bloquea eliminaciones en el kardex. |
| `trg_logs_auditoria_bloquea_update` | `logs_auditoria` | BEFORE UPDATE | Garantiza inmutabilidad de la auditoría. |
| `trg_logs_auditoria_bloquea_delete` | `logs_auditoria` | BEFORE DELETE | Impide el borrado de trazas de auditoría. |
| `trg_facturas_bloquea_reversion` | `facturas` | BEFORE UPDATE | Impide alterar facturas emitidas o anular más de una vez. |
| `trg_factura_pagos_check_total` | `factura_pagos` | BEFORE INSERT | Verifica que los montos de pago sean estrictamente positivos. |
| `trg_turnos_caja_calcula_diferencia` | `turnos_caja` | BEFORE UPDATE | Calcula la diferencia de caja al registrar el `fondo_final`. |

---

## 5. Scripts de Seeds y Mantenimiento

En `Warengine/Backend/packages/database/src/seeds/`:

1. **`run.ts` (`deno task seed`):**
   - Siembra roles del sistema, permisos y asignaciones RBAC de forma idempotente.
2. **`super-admin.seed.ts` (`deno task seed:dev`):**
   - Crea el usuario super-admin inicial en entornos de desarrollo utilizando la variable de entorno `SEED_SUPERADMIN_PASSWORD`.
   - Garantiza la creación de la Sede Principal (`id_sucursal: 1`) y el empleado de sistema (`SYS-001`).
3. **`limpiar-negocio.seed.ts` (`deno task seed:clean`):**
   - Vacia todas las tablas operativas de negocio (facturación, ítems, pagos, clientes, kardex, inventario, productos, proveedores, categorías, alertas, activos y logs).
   - Conserva intactos los roles, permisos, usuario **`superadmin`** y su empleado vinculado a la Sede Principal.
   - Aplica `SET FOREIGN_KEY_CHECKS = 0;` y `TRUNCATE` para no violar restricciones foráneas ni disparar los triggers inmutables.

---

## 6. Convenciones de Código y Buenas Prácticas

1. **Flujo de una petición HTTP:**
   ```
   HTTP Request
        │
        ▼
   api.routes.ts (Middleware Auth + Permiso)
        │
        ▼
   controller.ts (safeHandler + Zod Schema SafeParse)
        │
        ▼
   useCase.execute(dto) (Devuelve Result<T, DomainError>)
        │
        ▼
   presentResult(c, result) (Mapea a 200, 201, 400, 401, 403, 404, 409, 422)
        │
        ▼
   HTTP Response JSON
   ```

2. **Uso de `Result` vs Excepciones:**
   - Errores esperados (SKU duplicado, saldo insuficiente, credenciales inválidas): usar `Result.err(new DomainError(...))`.
   - Errores catastróficos/técnicos inesperados (pérdida de conexión a base de datos): pueden lanzar excepción y son capturados por el `safeHandler` de Hono respondiendo 500 Internal Server Error.

3. **Pruebas Unitarias:**
   - Ubicación: `packages/core/tests/<modulo>/<caso-de-uso>.test.ts`.
   - Se ejecutan con `deno test --allow-all`.
   - No tocan base de datos real: utilizan implementaciones *in-memory* o mocks de los repositorios e interfaces.

---

## 7. Referencias Rápidas y Comandos Útiles

| Tarea | Comando (desde `Warengine/Backend`) |
| :--- | :--- |
| **Iniciar API REST** | `deno task dev-api` (Puerto 8017 por defecto) |
| **Iniciar MCP Server** | `deno task dev-mcp` |
| **Ejecutar Tests** | `deno task test` |
| **Verificar Linter** | `deno task lint` |
| **Verificar Tipos** | `deno task check` |
| **Limpiar Datos de Negocio** | `deno task seed:clean` |
| **Sembrar Admin en Dev** | `deno task seed:dev` |
