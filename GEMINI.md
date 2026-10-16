# GEMINI.md — Guía de Contexto y Reglas de Desarrollo para Warengine

> **Archivo de Contexto Maestro y Reglas de Proyecto**  
> Este documento centraliza la arquitectura, el mapa de contexto documental y las restricciones obligatorias que todo asistente de IA (y desarrollador) debe seguir al trabajar en este repositorio.

---

## 1. Visión General y Stack Tecnológico

**Warengine** es un sistema ERP / Punto de Venta (POS) multi-sucursal para cadenas comerciales (venta mostrador B2C y venta corporativa B2B a crédito o contado), inventario multi-almacén y activos fijos.

* **Backend:** [Deno 2.x](https://deno.land/) con TypeScript estricto.
* **API Framework:** [Hono](https://hono.dev/) (ultraligero, estándar Web Request/Response).
* **Base de Datos & ORM:** MySQL 8.0 (InnoDB) con [Drizzle ORM](https://orm.drizzle.team/) + `mysql2/promise`.
* **Frontend:** [Next.js 16](https://nextjs.org/) (React, App Router, TypeScript).
* **Contratos y Validación:** [Zod](https://zod.dev/) centralizado en `@warengine/contracts`.
* **Protocolo IA:** Servidor MCP (Model Context Protocol) para ejecución de herramientas de agentes.

---

## 2. Mapa Maestro de Contexto y Documentación

Antes de implementar o modificar código en cualquier módulo, consulta los documentos de referencia correspondientes:

### 🏛️ Arquitectura y Reglas Fundamentales
* **[Docs/context/arquitectura-warengine.md](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/context/arquitectura-warengine.md):** Documento técnico integral de arquitectura (Clean Architecture, DDD, dependencias entre paquetes, triggers de base de datos).
* **[Docs/adr/0001-architecture-rules.md](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/adr/0001-architecture-rules.md):** Matriz estricta de dependencias entre paquetes del monorepo.
* **[Docs/adr/0002-auditoria.md](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/adr/0002-auditoria.md):** Especificación del sistema unificado de auditoría transversal `IAuditor`.
* **[Docs/context/proyecto-warengine.md](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/context/proyecto-warengine.md):** Especificación funcional y de requisitos completa del sistema.

### 📦 Módulos de Negocio (`Docs/modulos/`)
* **[Autenticación](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/modulos/autenticacion.md):** Login, JWT, Refresh Token, RBAC, 2FA/TOTP y política de bloqueo.
* **[Administración](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/modulos/administracion.md):** Sucursales (Sede Principal id=1), áreas, empleados, salarios, alertas y dashboard.
* **[Inventario](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/modulos/inventario.md):** Categorías, proveedores, catálogo de productos, stock sucursal, kardex append-only e importación masiva CSV.
* **[Facturación](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/modulos/facturacion.md):** Clientes B2C/B2B, turnos de caja (1 turno por usuario), ventas de mostrador y B2B.
* **[Logística](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/modulos/logistica.md):** Activos fijos, asignaciones y mantenimientos preventivos/correctivos.
* **[Auditoría](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/modulos/auditoria.md):** Registro de eventos inmutables, catálogo de acciones y sanitización.
* **[MCP Server](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/modulos/mcp.md):** Exposición de casos de uso para agentes inteligentes.

### 🔌 Infraestructura y Fontanería (`Docs/infraestructura/`)
* **[Shared Kernel](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/infraestructura/shared-kernel.md):** Monada `Result<T,E>`, `DomainError`, entidades y value objects.
* **[Base de Datos](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/infraestructura/base-de-datos.md):** Pool de conexiones MySQL2, esquemas Drizzle, repositorios y transacciones.
* **[Platform](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/infraestructura/platform.md):** Argon2id, JWT HS256 y configuración de entorno.
* **[Composition Root](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/infraestructura/composition.md):** Inyección de dependencias pura en `createContainer`.
* **[API REST](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/infraestructura/api.md):** Middlewares Hono, `safeHandler`, `presentResult` y códigos HTTP.
* **[Contratos Zod](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/infraestructura/contratos.md):** Esquemas de validación y DTOs en `@warengine/contracts`.

### 🗄️ Esquemas de Base de Datos
* **[Docs/database/WARENGINE_FULL_BD.sql](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Docs/database/WARENGINE_FULL_BD.sql):** Script DDL integral de MySQL 8 con todas las tablas, claves foráneas y triggers.

### 🧪 Pruebas Funcionales (.http)
En el directorio [Http/](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Http/) se encuentran escenarios listos para ejecutar con REST Client:
* `13-facturacion.http`: Flujo completo de turno de caja, stock, facturación mostrador y B2B.
* `24-importacion-masiva-productos.http`: Pruebas de importación masiva por CSV.
* `04-auditoria.http`, `07-usuario-sucursales.http`, `01-autenticacion.http`, etc.

---

## 3. Reglas Obligatorias de Arquitectura (No Negociables)

Cualquier cambio de código debe respetar estrictamente estas directrices:

### Regla 1: Inviolabilidad de `core`
* `packages/core` contiene **exclusivamente lógica de negocio y definiciones de puertos**.
* **PROHIBIDO** importar Drizzle, librerías SQL, Hono, JWT, bcrypt, Argon2 o APIs de infraestructura en `core/`.
* Los casos de uso dependen de interfaces (`IProductoRepository`, `IAuditor`, etc.), nunca de implementaciones concretas.

### Regla 2: Manejo de Errores con `Result<T, DomainError>`
* Las reglas de negocio que fallen (ej. saldo insuficiente, SKU duplicado, cliente bloqueado) **NUNCA deben lanzar excepciones (`throw`)**.
* Deben retornar `Result.err(new DomainError('CODIGO_ERROR', 'Mensaje descriptivo'))`.
* Las excepciones quedan reservadas para fallos catastróficos inesperados de infraestructura (ej. corte de red con la base de datos).

### Regla 3: Composition Root (`packages/composition`)
* Ningún controlador HTTP (`apps/api`) ni Tool MCP (`apps/mcp-server`) debe instanciar repositorios ni configurar la base de datos.
* Toda dependencia se ensambla en `packages/composition/src/container.ts` (`createContainer`).
* Los controladores solo invocan casos de uso ya provistos por `AppContainer`.

### Regla 4: Validación en Frontera con Zod (`Shared/contracts`)
* Toda petición externa (HTTP body, query params, headers o MCP params) debe validarse estrictamente con un esquema Zod de `@warengine/contracts`.
* Si la validación falla, se retorna `400 Bad Request` antes de invocar cualquier caso de uso.

### Regla 5: Auditoría Obligatoria (`IAuditor`)
* Todo caso de uso que cree, modifique o inactive registros debe inyectar `IAuditor` y registrar el evento.
* Estructura de auditoría: `{ antes: {...}, despues: {...} }`, registrando solo campos modificados.
* **NUNCA auditar contraseñas, hashes, tokens JWT ni secretos TOTP** (deben ser purgados con `sanitizarDetalles`).

### Regla 6: Triggers y Reglas de Integridad en BD
* El Kardex (`movimientos_inventario`) y los logs de auditoría (`logs_auditoria`) son **append-only**. Tienen triggers que impiden `UPDATE` y `DELETE`.
* No intentar "borrar" o "modificar" movimientos de inventario: siempre se inserta un `ajuste_entrada` o `ajuste_salida`.
* La Sede Principal tiene `id_sucursal: 1` y está reservada para el sistema.

---

## 4. Tareas y Comandos del Proyecto

Todos los comandos se ejecutan desde el directorio [Warengine/Backend/](file:///c:/Users/USUARIO/Desktop/WARENGINEE/Warengine/Backend/):

```bash
# Iniciar API REST en desarrollo (puerto 8017 por defecto)
deno task dev-api

# Iniciar servidor MCP para agentes inteligentes
deno task dev-mcp

# Ejecutar suite de pruebas unitarias (core/tests)
deno task test

# Verificar tipos de TypeScript
deno task check

# Ejecutar linter del proyecto
deno task lint

# Sembrar super-admin y datos iniciales en desarrollo
deno task seed:dev

# Limpiar datos de negocio conservando al super-admin y permisos
deno task seed:clean
```
