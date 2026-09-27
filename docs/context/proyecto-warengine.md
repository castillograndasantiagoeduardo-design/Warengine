# Contexto del Proyecto Warengine

> **Para el equipo de desarrollo (aprendices ADSO del SENA) y para el asistente IA (MCP):**
> Este documento es la guía de referencia obligatoria antes de escribir cualquier línea de código.
> Si no entiendes algo de aquí, pregunta antes de improvisar.

---

## 1. ¿Qué es Warengine?

Warengine es una plataforma de gestión empresarial que cubre inventario, facturación/POS, administración de personal, activos internos y un asistente conversacional con IA. Está construida sobre **Clean Architecture** y los principios **SOLID**, organizada como un monorepo con tres zonas independientes: `BACK/` (backend en Deno + TypeScript + Drizzle ORM + MySQL 8), `FRONT/` (frontend en Next.js con App Router) y `SHARED/` (contratos compartidos en TypeScript + Zod). El backend tiene dos "puertas de entrada" al sistema: la API REST y el servidor MCP, ambas reutilizando los mismos casos de uso.

---

## 2. Diagrama de dependencias entre capas

```
┌─────────────────────────────────────────────────────────────────────┐
│  SHARED/contracts  (solo Zod — forma de los datos)                  │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ importa
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  packages/shared-kernel  (TypeScript puro — sin dependencias)       │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ importa
                               ▼
┌─────────────────────────────────────────────────────────────────────┐
│  packages/core  (domain + application)                              │
│   → Entidades, casos de uso, ports (interfaces). SIN Drizzle.       │
└────────────────┬─────────────────────────┬──────────────────────────┘
                 │ implementa              │ implementa
                 ▼                         ▼
┌───────────────────────┐      ┌───────────────────────────────────────┐
│  packages/database    │      │  packages/platform                    │
│  (Drizzle, repos,     │      │  (JWT, hashing, TOTP, mailer, logger) │
│   mappers, migrations)│      │                                       │
└───────────┬───────────┘      └──────────────────┬────────────────────┘
            │ wired by                            │ wired by
            └───────────────────┬─────────────────┘
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│  packages/composition  (Composition Root)                           │
│   → createContainer(env): conecta todo. Único punto de acople.      │
└──────────────────────────────┬──────────────────────────────────────┘
                               │ recibe casos de uso
              ┌────────────────┴────────────────┐
              ▼                                  ▼
┌─────────────────────┐              ┌─────────────────────────────┐
│  apps/api           │              │  apps/mcp-server            │
│  (HTTP: rutas,      │              │  (MCP: gateway, catalog,    │
│   controllers,      │              │   tools, session, presenter) │
│   middlewares,      │              │                             │
│   presenters)       │              │                             │
└─────────────────────┘              └─────────────────────────────┘

FRONT/  →  solo @warengine/contracts  →  API REST (HTTP)
       NUNCA importa BACK directamente
```

**Regla de oro:** las flechas de dependencia **solo apuntan hacia adentro** (hacia capas más internas). Una capa interna jamás conoce a una capa externa.

---

## 3. Carpetas principales y módulos de negocio

### 3.1 `SHARED/contracts/src/`

| | |
|---|---|
| **Propósito** | Única fuente de verdad para la *forma* de los datos que viajan entre BACK y FRONT. |
| **Qué SÍ contiene** | Esquemas Zod (`loginSchema`, `crearProductoSchema`…), tipos TypeScript inferidos de esos esquemas (`LoginInput`, `CrearProductoInput`…), constantes de roles (`ROLES`), permisos (`PERMISSIONS`) y nombres de Tools MCP (`TOOL_NAMES`). |
| **Qué NO contiene** | Reglas de negocio ("el stock no puede quedar negativo" va en `core/domain`). Código que dependa de Deno, Node, React o cualquier librería que no sea `zod`. |
| **Principio SOLID** | **SRP**: este paquete tiene una sola responsabilidad: definir la forma de los datos. Si empieza a tener lógica de negocio, se convierte en un "mega-paquete" imposible de mantener. |
| **Convención de nombres** | `<accion-o-entidad-en-espanol>.schema.ts` para esquemas Zod. Ej.: `login.schema.ts`, `crear-producto.schema.ts`. |
| **Ejemplo real** | `autenticacion/login.schema.ts` — define `loginSchema` y el tipo `LoginInput`. |

---

### 3.2 `packages/shared-kernel/src/`

| | |
|---|---|
| **Propósito** | Bloques de construcción base que todos los demás paquetes de BACK pueden usar. |
| **Qué SÍ contiene** | `Result<T,E>` (evita lanzar excepciones en el dominio), `DomainError` (clase base para errores de negocio), `Entity<T>`, `ValueObject<T>`, `Money` (para montos monetarios), `Clock` (abstracción del tiempo), `Pagination`, `ids` (generación de UUIDs). |
| **Qué NO contiene** | Ningún import externo. Ni `zod`, ni Drizzle, ni nada de Deno stdlib. TypeScript puro. |
| **Principio SOLID** | **OCP**: al definir `Result` y `DomainError` aquí, los casos de uso pueden extenderse (nuevos tipos de error) sin modificar el código base. |
| **Convención de nombres** | PascalCase para clases y tipos. Ej.: `Result.ts`, `DomainError.ts`, `Money.ts`. |
| **Ejemplo real** | `Result.ts` — un caso de uso de login devuelve `Result<AuthToken, DomainError>` en lugar de lanzar un `throw`. |

---

### 3.3 `packages/core/src/modules/<modulo>/domain/`

| | |
|---|---|
| **Propósito** | Las reglas de negocio reales de Warengine. Aquí vive lo que el negocio exige, independientemente de cómo se almacene o transmita. |
| **Qué SÍ contiene** | Entidades (`Factura`, `Producto`, `Activo`), value objects (`Sku`, `Money`), eventos de dominio, invariantes del negocio. |
| **Qué NO contiene** | Imports de Drizzle, código HTTP, JWT, ni siquiera el nombre de ninguna tabla de BD. Si aparece `SELECT` o `drizzle`, está en el lugar equivocado. |
| **Principio SOLID** | **DIP**: el dominio define contratos (ports) y no depende de ninguna implementación concreta. `database` y `platform` dependen de `core`, no al revés. |
| **Convención de nombres** | PascalCase para entidades. Ej.: `Factura.ts`, `Producto.ts`, `Activo.ts`. |
| **Ejemplo real** | `facturacion/domain/Factura.ts` — tiene una regla `anular(autorizadoPor)` que solo funciona si la factura está en estado `emitida`. |

---

### 3.4 `packages/core/src/modules/<modulo>/application/use-cases/`

| | |
|---|---|
| **Propósito** | Orquestan las operaciones del dominio para cumplir con un caso de uso concreto del negocio. Son el "cerebro" de Warengine. |
| **Qué SÍ contiene** | Clases o funciones que reciben DTOs de entrada (validados con contracts), usan entities del dominio, llaman a ports (repositorios e interfaces de servicios) y devuelven un `Result`. |
| **Qué NO contiene** | Imports de Drizzle, código HTTP, lógica de presentación, datos de sesión de usuario. El caso de uso recibe todo lo que necesita por inyección de dependencias. |
| **Principio SOLID** | **SRP + ISP**: cada caso de uso hace exactamente una cosa. Los ports que usa son interfaces pequeñas y específicas, no un repositorio con 20 métodos. |
| **Convención de nombres** | `<accion-en-espanol>.use-case.ts`. Ej.: `emitir-factura.use-case.ts`, `login.use-case.ts`, `registrar-entrada.use-case.ts`. |
| **Ejemplo real** | `facturacion/application/use-cases/emitir-factura.use-case.ts` — verifica que el turno de caja esté abierto, crea la `Factura`, llama al repositorio para persistirla. |

---

### 3.5 `packages/core/src/modules/<modulo>/application/ports/`

| | |
|---|---|
| **Propósito** | Definir *qué* necesita el caso de uso sin decir *cómo* se implementa. Son contratos (interfaces TypeScript). |
| **Qué SÍ contiene** | Interfaces de repositorios (`IUsuarioRepository`, `IProductoRepository`), interfaces de servicios externos (`IPasswordHasher`, `ITokenService`, `IMailer`, `ITotpService`). |
| **Qué NO contiene** | Implementaciones. Ni una sola línea de Drizzle, fetch, bcrypt o nodemailer. Solo la firma de los métodos. |
| **Principio SOLID** | **DIP + ISP**: al depender de interfaces (ports) y no de implementaciones, podemos cambiar MySQL por PostgreSQL, o bcrypt por Argon2, sin tocar ni un caso de uso. |
| **Convención de nombres** | `<entidad-en-espanol>.repository.ts` o `<servicio-en-ingles>.ts`. Ej.: `usuario.repository.ts`, `password-hasher.ts`, `token-service.ts`. |
| **Ejemplo real** | `autenticacion/application/ports/usuario.repository.ts` — define `interface IUsuarioRepository { findByEmail(email: string): Promise<Usuario | null>; save(usuario: Usuario): Promise<void>; }` |

---

### 3.6 `packages/database/src/repositories/<modulo>/`

| | |
|---|---|
| **Propósito** | Implementar los ports de `core` usando Drizzle ORM y MySQL. |
| **Qué SÍ contiene** | Clases que implementan las interfaces de `core/application/ports/`. Queries Drizzle, mapeo de filas a entidades usando los mappers. Captura de errores MySQL (`SQLSTATE '45000'`) y traducción a `DomainError`. |
| **Qué NO contiene** | Lógica de negocio. Si un repositorio decide si "se puede hacer la operación", está haciendo el trabajo de un caso de uso. |
| **Principio SOLID** | **LSP**: la implementación del repositorio debe ser intercambiable con cualquier otra que cumpla el port, sin que el caso de uso lo note. |
| **Convención de nombres** | `<entidad-en-espanol>.repository.ts` dentro de la subcarpeta del módulo. Ej.: `repositories/autenticacion/usuario.repository.ts`. |
| **Ejemplo real** | `repositories/inventario/producto.repository.ts` — implementa `IProductoRepository` con Drizzle, traduce el `SIGNAL SQLSTATE '45000'` de MySQL a `StockInsuficienteError`. |

---

### 3.7 `packages/database/src/mappers/`

| | |
|---|---|
| **Propósito** | Convertir filas de la base de datos en entidades de dominio y viceversa. |
| **Qué SÍ contiene** | Funciones puras `fromRow(row) → Entity` y `toRow(entity) → Record`. No tienen lógica de negocio: solo convierten formatos. |
| **Qué NO contiene** | Validaciones de negocio, queries a la BD, imports de `core/domain`. Solo mapeo de datos. |
| **Convención de nombres** | `<entidad-en-espanol>.mapper.ts`. Ej.: `producto.mapper.ts`, `factura.mapper.ts`. |
| **Ejemplo real** | `producto.mapper.ts` — convierte `{ id_producto, sku, precio_venta, … }` (fila Drizzle) en una instancia de la entidad `Producto`. |

---

### 3.8 `packages/platform/src/`

| | |
|---|---|
| **Propósito** | "Fontanería" técnica. Implementa los ports técnicos de `core` sin ninguna lógica de negocio. |
| **Qué SÍ contiene** | `jwt/` (firma/verificación JWT), `hashing/` (hash de contraseñas con Argon2), `totp/` (códigos TOTP para 2FA), `mailer/` (envío de correos), `logger/`, `rate-limit/`, `config/` (variables de entorno validadas con Zod). |
| **Qué NO contiene** | Nada de Warengine. Si aquí aparece `Factura`, `stock` o `sucursal`, algo está muy mal. |
| **Principio SOLID** | **SRP**: cada subcarpeta tiene una única responsabilidad técnica. El módulo JWT no sabe nada del módulo de hashing. |
| **Convención de nombres** | Nombre técnico en inglés para el directorio, archivos con sufijo que indica su rol. Ej.: `jwt/jwt-token-service.ts`. |
| **Ejemplo real** | `hashing/argon2-password-hasher.ts` — implementa `IPasswordHasher` usando la librería Argon2. |

---

### 3.9 `packages/composition/src/container.ts`

| | |
|---|---|
| **Propósito** | Único punto del monorepo donde `core`, `database` y `platform` se conocen. Construye el árbol de dependencias completo. |
| **Qué SÍ contiene** | La función `createContainer(env)` que instancia repositorios, servicios técnicos y casos de uso, conectando cada port con su implementación concreta. |
| **Qué NO contiene** | Lógica de negocio, rutas HTTP, lógica de Tools MCP. Solo `new X(new Y(new Z()))`. |
| **Principio SOLID** | **DIP**: es el lugar donde se "resuelve" la inversión de dependencias, inyectando implementaciones en las interfaces. |
| **Convención de nombres** | Un único archivo `container.ts`. Si crece mucho, puede dividirse en `autenticacion.container.ts`, etc. |
| **Ejemplo real** | `const usuarioRepo = new DrizzleUsuarioRepository(dbClient); const loginUseCase = new LoginUseCase(usuarioRepo, hasher, tokenService);` |

---

### 3.10 `apps/api/src/`

| | |
|---|---|
| **Propósito** | Traducir peticiones HTTP en llamadas a casos de uso y devolver respuestas HTTP. |
| **Qué SÍ contiene** | Rutas (`autenticacion.routes.ts`), controllers (validan con contracts → ejecutan caso de uso → pasan al presenter), middlewares (`authenticate.middleware.ts`, `authorize.middleware.ts`), presenters (convierten `Result` en códigos HTTP). |
| **Qué NO contiene** | Lógica de negocio. Si un controller tiene un `if` que evalúa una regla de negocio (ej. "si el stock es 0"), está en el lugar equivocado. |
| **Principio SOLID** | **SRP**: cada controller tiene una responsabilidad: recibir HTTP, delegar al caso de uso, devolver la respuesta. |
| **Convención de nombres** | `<modulo-en-espanol>.routes.ts`, `<accion>.controller.ts`, `<nombre>.middleware.ts`. Ej.: `login.controller.ts`, `authenticate.middleware.ts`. |
| **Ejemplo real** | `controllers/login.controller.ts` — valida el cuerpo con `loginSchema.parse(body)`, llama a `container.loginUseCase.execute(input)`, pasa el resultado al `authPresenter`. |

---

### 3.11 `apps/mcp-server/src/`

| | |
|---|---|
| **Propósito** | Segunda puerta de entrada al sistema para el asistente IA. Expone Tools seguras que reutilizan los mismos casos de uso que la API REST. |
| **Qué SÍ contiene** | `session/` (valida JWT del login y resuelve usuario/rol/sucursal), `gateway/` (autoriza → valida con Zod → audita → ejecuta caso de uso), `catalog/` (registro de Tools y filtro por rol), `tools/` (una Tool por archivo, cada una define su nombre, descripción y schema de input), `presenters/` (convierte resultado en texto para el LLM). |
| **Qué NO contiene** | Lógica de autorización dentro de cada Tool (eso lo hace el gateway). Lógica de negocio. Consultas directas a la BD. |
| **Principio SOLID** | **SRP + OCP**: el gateway centraliza la autorización (SRP). Agregar una Tool nueva no requiere modificar el gateway (OCP). |
| **Convención de nombres** | `<accion-en-espanol>.tool.ts`. Ej.: `consulta-stock.tool.ts`, `ventas-periodo.tool.ts`. |
| **Ejemplo real** | `tools/inventario/consulta-stock.tool.ts` — declara nombre `"consulta-stock"`, schema Zod de input, delega al gateway que llama a `consultarStockUseCase.execute(input)`. |

---

### 3.12 `FRONT/src/app/` (rutas Next.js)

| | |
|---|---|
| **Propósito** | Define la estructura de URL y los layouts de la aplicación. Solo estructura, sin lógica. |
| **Qué SÍ contiene** | Archivos `page.tsx` y `layout.tsx` organizados en grupos de rutas: `(autenticacion)/`, `(panel)/`, `(punto-de-venta)/`. Los grupos entre paréntesis son invisibles en la URL. |
| **Qué NO contiene** | Llamadas directas a la API, lógica de formularios, estado complejo. Todo eso va en `features/`. |
| **Convención de nombres** | Carpetas en español en kebab-case: `(autenticacion)/iniciar-sesion/page.tsx`. |
| **Ejemplo real** | `app/(autenticacion)/iniciar-sesion/page.tsx` — importa el componente `LoginForm` desde `features/autenticacion/components/`. |

---

### 3.13 `FRONT/src/features/<modulo>/`

| | |
|---|---|
| **Propósito** | Toda la lógica de presentación de un módulo de negocio: formularios, llamadas a la API, estado local. |
| **Qué SÍ contiene** | `components/` (formularios y UI específica del módulo), `hooks/` (React Query, estado, efectos), `api/` (funciones que llaman al backend usando los tipos de `@warengine/contracts`). |
| **Qué NO contiene** | Lógica de negocio real (ej. calcular subtotales, validar stock). Los esquemas de validación vienen de `@warengine/contracts`, no se reinventan aquí. |
| **Principio SOLID** | **SRP**: cada feature folder es autónoma. El módulo de inventario no importa nada del módulo de facturación. |
| **Convención de nombres** | `components/`: PascalCase (`LoginForm.tsx`). `hooks/`: camelCase con prefijo `use` (`useLogin.ts`). `api/`: camelCase (`autenticacion.api.ts`). |
| **Ejemplo real** | `features/autenticacion/components/LoginForm.tsx` — usa `loginSchema` de `@warengine/contracts` para validar el formulario con react-hook-form. |

---

## 4. Módulos de negocio en `packages/core/src/modules/`

### autenticacion
- **domain**: `Usuario`, `Rol`, `Permiso`, `IntentoLogin`, `PoliticaContrasena`, interfaz `IAuthorizationPolicy`
- **use-cases**: `login.use-case.ts`, `logout.use-case.ts`, `refresh-token.use-case.ts`, `solicitar-recuperacion.use-case.ts`, `restablecer-contrasena.use-case.ts`, `verificar-2fa.use-case.ts`
- **ports**: `usuario.repository.ts`, `password-hasher.ts`, `token-service.ts`, `mailer.ts`, `totp-service.ts`
- **services**: `rbac-authorization-policy.ts`

### inventario
- **domain**: `Producto`, `Sku`, `StockSucursal`, `MovimientoInventario`
- **use-cases**: `crear-producto.use-case.ts`, `registrar-entrada.use-case.ts`, `registrar-salida.use-case.ts`, `ajustar-stock.use-case.ts`, `listar-stock-bajo.use-case.ts`, `kardex.use-case.ts`, `gestionar-categorias.use-case.ts`, `gestionar-proveedores.use-case.ts`

### facturacion
- **domain**: `Factura`, `ItemFactura`, `Pago`, `TurnoCaja`, `Cliente`
- **use-cases**: `abrir-turno.use-case.ts`, `cerrar-turno.use-case.ts`, `emitir-factura.use-case.ts`, `anular-factura.use-case.ts`, `registrar-devolucion.use-case.ts`, `registrar-cliente.use-case.ts`, `buscar-cliente.use-case.ts`

### administracion
- **domain**: `Sucursal`, `Empleado`, `HistorialSalario`, `AlertaAdmin`, `LogAuditoria`
- **use-cases**: `gestionar-sucursales.use-case.ts`, `gestionar-usuarios.use-case.ts`, `asignar-rol.use-case.ts`, `dashboard-metricas.use-case.ts`, `consultar-auditoria.use-case.ts`, `crear-alerta.use-case.ts`, `atender-alerta.use-case.ts`

### logistica
- **domain**: `Activo`, `AsignacionActivo`, `Mantenimiento`, `Area`
- **use-cases**: `registrar-activo.use-case.ts`, `asignar-activo.use-case.ts`, `devolver-activo.use-case.ts`, `registrar-mantenimiento.use-case.ts`, `dar-de-baja.use-case.ts`

### mcp-audit
- **use-cases**: `registrar-invocacion-tool.use-case.ts`
- **ports**: `log-mcp-tool.repository.ts`

---

## 5. Cómo debe trabajar el agente / MCP en este repositorio

### Pasos obligatorios para crear un caso de uso nuevo

```
1. DOMAIN (si la entidad no existe aún)
   └─ Crea la entidad y sus reglas en:
      packages/core/src/modules/<modulo>/domain/<Entidad>.ts

2. PORTS (si el caso de uso necesita una dependencia externa)
   └─ Crea la interfaz en:
      packages/core/src/modules/<modulo>/application/ports/<nombre>.ts
      Ejemplo: producto.repository.ts, mailer.ts

3. USE CASE
   └─ Escribe el caso de uso usando SOLO los ports (interfaces), nunca
      implementaciones concretas:
      packages/core/src/modules/<modulo>/application/use-cases/<accion>.use-case.ts

4. IMPLEMENTACIÓN DEL PORT
   └─ Implementa el port en:
      - packages/database/src/repositories/<modulo>/ (si es de BD)
      - packages/platform/src/<servicio>/            (si es técnico)

5. COMPOSITION
   └─ Conecta la implementación al port en:
      packages/composition/src/container.ts

6a. EXPOSICIÓN VÍA API REST
    └─ Agrega ruta en:   apps/api/src/routes/<modulo>.routes.ts
    └─ Crea controller:  apps/api/src/controllers/<accion>.controller.ts
    └─ NO escribas lógica de negocio ahí.

6b. EXPOSICIÓN VÍA MCP TOOL
    └─ Crea la Tool en:  apps/mcp-server/src/tools/<modulo>/<accion>.tool.ts
    └─ Regístrala en:    apps/mcp-server/src/catalog/
    └─ La Tool NO tiene lógica de autorización: el gateway la maneja.
```

### Señales de alarma — "algo está muy mal"

| Señal | Qué está rompiendo |
|---|---|
| `import { drizzle }` dentro de `packages/core/` | Violación de DIP: core no puede conocer Drizzle. |
| Un controller con `if (stock < cantidad) throw …` | El controller está haciendo trabajo del dominio. |
| Una Tool que llama directamente a un repositorio | La Tool debe pasar siempre por el gateway y el caso de uso. |
| `import { Factura } from '@warengine/core'` dentro de `FRONT/` | FRONT no puede importar entidades de dominio. Solo DTOs de contracts. |
| Un `DomainError` que llega al controller sin pasar por el presenter | El presenter es el encargado de convertir errores en respuestas HTTP/MCP. |
| `schema.ts` con una regla como `stock >= 0` | Las reglas de negocio van en `domain`, no en los esquemas de contracts. |
| Un mapper con un `if` de negocio | Los mappers solo convierten formatos, no toman decisiones de negocio. |
| `console.log` en producción dentro de un caso de uso | Usar el `logger` de `packages/platform`, inyectado como port. |

### Checklist antes de dar por terminada cualquier tarea de código

- [ ] ¿El caso de uso es alcanzable tanto desde la API REST como desde el MCP sin duplicar lógica?
- [ ] ¿La Tool del MCP valida sus parámetros con Zod (desde `@warengine/contracts`) antes de llegar al caso de uso?
- [ ] ¿El resultado que se expone al exterior es un DTO y no una entidad de dominio ni una fila de base de datos?
- [ ] ¿El nuevo port está declarado en `core/application/ports/` como una interfaz y NO como una clase concreta?
- [ ] ¿La implementación del port (repositorio o servicio técnico) está conectada en `composition/container.ts`?
- [ ] ¿El repositorio captura los errores MySQL (`SQLSTATE '45000'`) y los traduce a `DomainError` antes de que salgan del paquete `database`?
- [ ] ¿El código nuevo pasa `deno check` (BACK) y `tsc --noEmit` (FRONT) sin errores?
- [ ] ¿No se duplicó ninguna validación que ya aplica la base de datos mediante un CHECK o trigger?

---

## 6. Reglas vivas de la base de datos

> **IMPORTANTE:** MySQL ya aplica estas reglas por sí mismo mediante triggers y CHECK constraints.
> El backend NO debe reimplementarlas en TypeScript: solo debe manejar el error que MySQL lanza cuando las viola.

### 6.1 Tabla resumen de TRIGGERS

| Nombre del trigger | Tabla · Momento | Qué regla de negocio protege | Efecto colateral |
|---|---|---|---|
| `trg_movimientos_check_stock` | `movimientos_inventario` · BEFORE INSERT | Una salida o ajuste_salida no puede dejar el stock en negativo (RF-ADM-B9) | Ninguno — solo bloquea |
| `trg_movimientos_actualiza_stock` | `movimientos_inventario` · AFTER INSERT | El kardex es la fuente de verdad del stock | **Actualiza** `inventario_sucursal.stock_actual` automáticamente |
| `trg_factura_items_check_stock` | `factura_items` · BEFORE INSERT | No se puede vender más de lo que hay en la sucursal de la factura (RF-02) | Ninguno — solo bloquea |
| `trg_factura_items_genera_salida` | `factura_items` · AFTER INSERT | Al vender, se genera automáticamente el movimiento de salida en el kardex | **Inserta** en `movimientos_inventario` (tipo `salida`) |
| `trg_factura_pagos_check_total` | `factura_pagos` · AFTER INSERT | La suma de pagos no puede superar el total de la factura (soporta pago dividido) | Ninguno — solo bloquea |
| `trg_factura_pagos_check_credito` | `factura_pagos` · BEFORE INSERT | El crédito corporativo solo aplica a clientes B2B con `credito_habilitado = 1` (RF-FMC-E2) | Ninguno — solo bloquea |
| `trg_asignaciones_check_disponibilidad` | `asignaciones_activos` · BEFORE INSERT | La asignación debe tener exactamente un responsable (empleado O área, no ambos ni ninguno); el activo debe estar `disponible` | Ninguno — solo bloquea |
| `trg_asignaciones_check_responsable_update` | `asignaciones_activos` · BEFORE UPDATE | Misma regla del responsable único, también al editar | Ninguno — solo bloquea |
| `trg_asignaciones_marca_asignado` | `asignaciones_activos` · AFTER INSERT | Al crear una asignación activa, el activo pasa a estado `asignado` | **Actualiza** `activos.estado = 'asignado'` |
| `trg_asignaciones_autoset_devuelta` | `asignaciones_activos` · BEFORE UPDATE | Si se registra `fecha_devolucion_real`, el estado pasa a `devuelta` automáticamente | **Modifica** `NEW.estado = 'devuelta'` |
| `trg_asignaciones_marca_devuelto` | `asignaciones_activos` · AFTER UPDATE | Al marcar como devuelta, el activo vuelve a `disponible` | **Actualiza** `activos.estado = 'disponible'` (solo si estaba en `asignado`) |
| `trg_mantenimientos_inicia` | `mantenimientos_activos` · AFTER INSERT | Al registrar un mantenimiento sin `fecha_fin`, el activo pasa a `mantenimiento` | **Actualiza** `activos.estado = 'mantenimiento'` (no pisa `baja`) |
| `trg_mantenimientos_finaliza` | `mantenimientos_activos` · AFTER UPDATE | Al cerrar el mantenimiento (`fecha_fin` pasa de NULL a fecha), el activo vuelve a `disponible` | **Actualiza** `activos.estado = 'disponible'` |
| `trg_historial_salarios_sync` | `historial_salarios` · AFTER INSERT | Cada cambio de sueldo actualiza automáticamente el campo `empleados.sueldo_actual` | **Actualiza** `empleados.sueldo_actual` |
| `trg_devoluciones_check_cantidad` | `devoluciones_ventas` · BEFORE INSERT | Valida: factura correcta, sucursal correcta, factura no anulada, cantidad devuelta ≤ vendida, monto de reembolso ≤ valor de lo devuelto | Ninguno — solo bloquea |
| `trg_devoluciones_genera_entrada` | `devoluciones_ventas` · AFTER INSERT | Si el producto reingresa a bodega (`reingresa_stock = 1`), genera la entrada en el kardex | **Inserta** en `movimientos_inventario` (tipo `entrada`) |
| `trg_turnos_caja_calcula_diferencia` | `turnos_caja` · BEFORE UPDATE | Al cerrar el turno, calcula la diferencia de caja (fondo contado vs. fondo esperado según efectivo vendido) | **Calcula y escribe** `turnos_caja.diferencia` automáticamente |
| `trg_facturas_bloquea_reversion` | `facturas` · BEFORE UPDATE | Una factura anulada no puede volver a `emitida`; toda anulación requiere `anulada_por` | Ninguno — solo bloquea |
| `trg_facturas_anula_reingresa_stock` | `facturas` · AFTER UPDATE | Al anular una factura, reingresa al kardex lo vendido (menos lo ya devuelto con reingreso) | **Inserta** en `movimientos_inventario` (tipo `entrada`) |
| `trg_movimientos_bloquea_update` | `movimientos_inventario` · BEFORE UPDATE | El kardex es de solo inserción. Ninguna fila puede modificarse | Bloquea cualquier UPDATE con error |
| `trg_movimientos_bloquea_delete` | `movimientos_inventario` · BEFORE DELETE | El kardex es de solo inserción. Ninguna fila puede eliminarse | Bloquea cualquier DELETE con error |
| `trg_productos_precio_corporativo_fecha` | `productos` · BEFORE UPDATE | Registra automáticamente cuándo cambió el precio corporativo (RF-FMC-C6) | **Actualiza** `productos.precio_corporativo_actualizado_en = NOW()` |
| `trg_usuarios_marca_invalidacion_token` | `usuarios` · BEFORE UPDATE | Si cambia el rol o el estado de la cuenta, los JWT anteriores se invalidan (RF-SA-D11) | **Actualiza** `usuarios.tokens_invalidados_en = NOW()` |
| `trg_usucursales_marca_invalidacion_insert` | `usuario_sucursales` · AFTER INSERT | Asignar una sucursal nueva invalida los JWT anteriores del usuario | **Actualiza** `usuarios.tokens_invalidados_en = NOW()` |
| `trg_usucursales_marca_invalidacion_delete` | `usuario_sucursales` · AFTER DELETE | Quitar una sucursal invalida los JWT anteriores del usuario | **Actualiza** `usuarios.tokens_invalidados_en = NOW()` |

---

### 6.2 Tabla resumen de CHECK CONSTRAINTS

| Tabla | Nombre del constraint | Condición en lenguaje simple |
|---|---|---|
| `empleados` | `chk_empleados_tipo_documento` | El tipo de documento del empleado solo puede ser `CC` o `CE` |
| `inventario_sucursal` | `chk_inventario_stock_actual` | El stock actual de un producto en una sucursal no puede ser negativo |
| `inventario_sucursal` | `chk_inventario_stock_minimo` | El stock mínimo no puede ser negativo |
| `movimientos_inventario` | `chk_movimientos_tipo` | El tipo de movimiento solo puede ser `entrada`, `salida`, `ajuste_entrada` o `ajuste_salida` |
| `movimientos_inventario` | `chk_movimientos_cantidad` | La cantidad de un movimiento debe ser mayor que 0 |
| `activos` | `chk_activos_estado` | El estado de un activo solo puede ser `disponible`, `asignado`, `mantenimiento` o `baja` |
| `asignaciones_activos` | `chk_asignaciones_estado` | El estado de una asignación solo puede ser `activa`, `devuelta` o `vencida` |
| `clientes` | `chk_clientes_tipo` | El tipo de cliente solo puede ser `B2C` o `B2B` |
| `clientes` | `chk_clientes_tipo_documento` | El tipo de documento del cliente solo puede ser `CC`, `NIT` o `RUT` |
| `clientes` | `chk_clientes_datos_b2b` | Si el cliente es B2B, los campos `direccion` y `telefono` son obligatorios |
| `facturas` | `chk_facturas_estado` | El estado de una factura solo puede ser `emitida` o `anulada` |
| `factura_items` | `chk_facturaitems_cantidad` | La cantidad de ítems en una factura debe ser mayor que 0 |
| `factura_pagos` | `chk_facturapagos_medio` | El medio de pago solo puede ser `efectivo`, `tarjeta`, `transferencia` o `credito_corporativo` |
| `factura_pagos` | `chk_facturapagos_monto` | El monto de un pago debe ser mayor que 0 |
| `devoluciones_ventas` | `chk_devoluciones_cantidad` | La cantidad devuelta debe ser mayor que 0 |
| `alertas_admin` | `chk_alertas_prioridad` | La prioridad de una alerta solo puede ser `urgente` o `normal` |
| `alertas_admin` | `chk_alertas_estado` | El estado de una alerta solo puede ser `pendiente`, `visto` o `atendido` |
| `logs_mcp_tools` | `chk_logsmcp_resultado` | El resultado de una invocación de Tool MCP solo puede ser `permitido` o `denegado` |

---

### 6.3 Foreign Keys "especiales" (ON DELETE diferente de RESTRICT)

| FK | Tabla padre | Qué pasa si se borra el padre |
|---|---|---|
| `fk_rolpermisos_rol` | `roles` | **CASCADE**: si se borra un rol, se borran automáticamente sus permisos asignados en `rol_permisos`. |
| `fk_rolpermisos_permiso` | `permisos` | **CASCADE**: si se borra un permiso, se borra de todos los roles que lo tenían. |
| `fk_historial_empleado` | `empleados` | **CASCADE**: si se borra un empleado, se borra todo su historial de salarios. (Usar soft delete en la práctica.) |
| `fk_refresh_usuario` | `usuarios` | **CASCADE**: si se borra un usuario, se borran todos sus refresh tokens automáticamente. |
| `fk_pwreset_usuario` | `usuarios` | **CASCADE**: si se borra un usuario, se borran sus tokens de recuperación de contraseña. |
| `fk_usucursales_usuario` | `usuarios` | **CASCADE**: si se borra un usuario, se borran sus asignaciones de sucursal. |
| `fk_usucursales_sucursal` | `sucursales` | **CASCADE**: si se borra una sucursal, se borran las asignaciones de usuario a esa sucursal. |
| `fk_empleados_area` | `areas` | **SET NULL**: si se borra un área, el campo `area_id` del empleado queda en NULL (el empleado no se borra). |
| `fk_inventario_producto` | `productos` | **CASCADE**: si se borra un producto, se borra su registro de stock en todas las sucursales. |
| `fk_movimientos_proveedor` | `proveedores` | **SET NULL**: si se borra un proveedor, los movimientos de inventario relacionados pierden la referencia al proveedor (el movimiento no se borra). |
| `fk_logsauditoria_usuario` | `usuarios` | **SET NULL**: si se borra un usuario, los logs de auditoría conservan el registro pero `usuario_id` queda en NULL. |
| `fk_logsmcp_usuario` | `usuarios` | **SET NULL**: si se borra un usuario, los logs de MCP conservan el registro pero `usuario_id` queda en NULL. |
| `fk_asignaciones_empleado` | `empleados` | **SET NULL**: si se borra un empleado, la asignación del activo queda sin empleado (pero la asignación permanece). |
| `fk_asignaciones_area` | `areas` | **SET NULL**: si se borra un área, la asignación del activo queda sin área referenciada. |
| `fk_mantenimientos_proveedor` | `proveedores` | **SET NULL**: si se borra un proveedor, el mantenimiento conserva el registro pero sin referencia al proveedor. |
| `fk_movimientos_devolucion` | `devoluciones_ventas` | **SET NULL**: si se borra una devolución (soft delete), el movimiento de inventario pierde la referencia pero no se borra. |

---

### 6.4 Columnas con `COLLATE utf8mb4_bin` (comparación exacta)

Estas columnas comparan byte a byte, lo que significa que son **sensibles a mayúsculas y tildes**. El backend **no debe normalizar estos valores** antes de consultarlos en la BD.

| Tabla | Columna | Por qué se usa COLLATE utf8mb4_bin |
|---|---|---|
| `permisos` | `codigo` | El código de permiso (`auth:manage-users`) debe coincidir exactamente. Una variación de mayúsculas significaría un permiso diferente. |
| `empleados` | `numero_documento` | Los números de documento deben coincidir tal cual, sin que MySQL los iguale por insensibilidad. |
| `usuarios` | `password_hash` | Un hash de contraseña es una cadena binaria exacta. Cualquier normalización rompería la comparación. |
| `usuarios` | `totp_secret` | El secreto TOTP es un valor binario que no debe alterarse. |
| `clientes` | `numero_documento` | Igual que en empleados: comparación exacta por diseño. |
| `refresh_tokens` | `token_hash` | Los hashes de tokens son binarios exactos. Cualquier normalización haría que tokens válidos parecieran inválidos. |
| `password_reset_tokens` | `token_hash` | Igual que `refresh_tokens`. |
| `productos` | `sku` | El SKU de un producto (`SKU-001` ≠ `sku-001`) debe ser único y exacto. |
| `activos` | `codigo_activo` | El código de activo es un identificador exacto, igual que el SKU. |

---

### 6.5 Tablas de solo inserción (append-only)

> ⚠️ **ADVERTENCIA:** intentar hacer UPDATE o DELETE en estas tablas causará un error de MySQL (`SQLSTATE '45000'`). La corrección siempre es insertar una fila nueva.

| Tabla | Trigger que la protege | Qué hacer en lugar de editar/borrar |
|---|---|---|
| `movimientos_inventario` | `trg_movimientos_bloquea_update` y `trg_movimientos_bloquea_delete` | Si un movimiento fue incorrecto, insertar un `ajuste_entrada` o `ajuste_salida` que corrija el saldo. Nunca modificar el registro original. |

**Consecuencia práctica:** los casos de uso `ajustar-stock.use-case.ts` y similares siempre crean movimientos nuevos, nunca modifican los existentes. El kardex es inmutable por diseño.

---

### 6.6 Deuda técnica y pendientes conocidos de la BD

Los siguientes puntos fueron marcados explícitamente como `-- PENDIENTE` en el script SQL original. El agente y los desarrolladores **no deben asumir que están resueltos**:

| Pendiente | Dónde está | Descripción |
|---|---|---|
| Reembolsos en efectivo en el cierre de turno | `trg_turnos_caja_calcula_diferencia` | El cálculo de la diferencia de caja descuenta el efectivo vendido, pero **todavía no descuenta los reembolsos en efectivo de devoluciones**. El autor del SQL dejó una nota indicando que esto requiere decidir si el reembolso se registra como un medio de pago negativo, una tabla separada, o un campo adicional en `devoluciones_ventas`. Hasta que se resuelva, el campo `diferencia` en `turnos_caja` puede ser inexacto si hubo devoluciones en efectivo durante el turno. |

---

### 6.7 Nota operativa: manejo de errores de MySQL en el backend

Cuando la base de datos rechaza una operación por un trigger o un CHECK constraint, MySQL lanza:

```sql
SIGNAL SQLSTATE '45000' SET MESSAGE_TEXT = 'Mensaje legible aquí';
```

**Lo que debe hacer la capa `packages/database`:**

1. **Capturar** el error de MySQL antes de que salga del repositorio.
2. **Traducirlo** a un `DomainError` del dominio (ej. `StockInsuficienteError`, `FacturaYaAnuladaError`).
3. **Devolver** ese `DomainError` encapsulado en un `Result.fail(error)`.

**Lo que NUNCA debe pasar:**

- Un error MySQL crudo llegando al controller o presenter como un error 500 genérico.
- Un caso de uso reimplementando en TypeScript una validación que ya aplica un CHECK o trigger. Si la BD ya garantiza que `stock_actual >= 0`, el caso de uso no necesita volver a verificarlo — solo debe manejar el `DomainError` si la BD lo rechaza.

**Ejemplo de flujo correcto:**

```
BD lanza SQLSTATE '45000' "Stock insuficiente..."
  ↓
DrizzleProductoRepository captura el error MySQL
  ↓
Traduce a: new StockInsuficienteError('El producto SKU-001 no tiene stock suficiente')
  ↓
Devuelve: Result.fail(stockError)
  ↓
EmitirFacturaUseCase recibe Result.fail → devuelve Result.fail
  ↓
Controller pasa al presenter
  ↓
Presenter convierte a HTTP 422 con mensaje legible
```
