# Módulo de Autenticación y Autorización — Warengine

> **Versión documentada:** Implementación completa (Fases 0–8)  
> **Stack:** Deno · TypeScript · Drizzle ORM · MySQL 8 · Hono · Jose (JWT) · Argon2  
> **Arquitectura:** Clean Architecture + SOLID + RBAC granular por permisos

---

## Índice

1. [Visión general](#1-visión-general)
2. [Diagrama de capas y dependencias](#2-diagrama-de-capas-y-dependencias)
3. [Shared Kernel — Cimientos sin dependencias externas](#3-shared-kernel)
4. [Base de Datos — Esquema y Seeds](#4-base-de-datos)
5. [Core — Dominio y Casos de Uso](#5-core)
6. [Platform — Servicios técnicos](#6-platform)
7. [Database — Repositorios e Infraestructura de Datos](#7-database-repositorios)
8. [Composition — Contenedor de Inyección de Dependencias](#8-composition)
9. [API REST — Presentación HTTP](#9-api-rest)
10. [RBAC — Control de Acceso Basado en Permisos](#10-rbac)
11. [Flujos de datos extremo a extremo](#11-flujos-de-datos)
12. [Pruebas Unitarias](#12-pruebas-unitarias)
13. [Scripts de Arranque](#13-scripts-de-arranque)
14. [Variables de Entorno Requeridas](#14-variables-de-entorno)
15. [Reglas de seguridad críticas](#15-reglas-de-seguridad-críticas)

---

## 1. Visión General

El módulo de Autenticación de Warengine implementa un sistema de **login seguro con JWT + Refresh Tokens**, complementado por un **control de acceso granular basado en permisos (RBAC)** — no en roles estáticos.

### ¿Qué puede hacer este módulo?

| Funcionalidad | Descripción |
|---|---|
| **Login** | Autentica al usuario por email y contraseña. Devuelve un Access Token (15 min) y un Refresh Token (7 días). |
| **Renovar Token** | Rota el Refresh Token y emite un nuevo par, invalidando el anterior (previene replay attacks). |
| **Validar Permiso** | Verifica que un Access Token sea válido, que las credenciales no hayan sido revocadas, y que el rol del usuario tenga el permiso específico requerido. |
| **RBAC Granular** | Los permisos se asignan directamente a roles (ej. `facturacion:facturar`). El código nunca verifica si el usuario es "admin" sino si tiene el permiso exacto requerido. |

---

## 2. Diagrama de Capas y Dependencias

```
┌──────────────────────────────────────────────────────────┐
│                    apps/api (Hono)                       │
│   routes  →  controllers  →  presenters / middlewares    │
└──────────────────────┬───────────────────────────────────┘
                       │ usa
┌──────────────────────▼───────────────────────────────────┐
│           packages/composition / container.ts            │
│         (único punto donde todas las capas se tocan)     │
└────┬──────────────────┬──────────────────┬───────────────┘
     │                  │                  │
┌────▼──────┐  ┌────────▼───────┐  ┌──────▼────────────────┐
│  database  │  │    platform    │  │        core            │
│ Drizzle    │  │ JWT · Argon2   │  │ domain · use-cases     │
│ repos      │  │ (implementa    │  │ (define los Ports)     │
│ mappers    │  │  los Ports)    │  │                        │
└────┬───────┘  └────────────────┘  └──────┬─────────────────┘
     │                                     │
     └──────────────┬──────────────────────┘
                    │ ambos dependen de
          ┌─────────▼──────────┐
          │  shared-kernel     │
          │  Result · Error    │
          │  (TypeScript puro) │
          └────────────────────┘
```

**Regla de oro:** Las flechas solo van hacia adentro. `core` nunca importa `database` ni `platform`. La capa exterior adapta a la interior, nunca al revés.

---

## 3. Shared Kernel

**Ruta:** `packages/shared-kernel/`  
**Propósito:** Bloques de construcción base que no tienen ninguna dependencia externa. TypeScript puro.

### 3.1 `DomainError`

[`DomainError.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/shared-kernel/src/DomainError.ts)

Clase base abstracta para todos los errores de negocio de Warengine. Cada error concreto:
- Hereda de `DomainError`
- Define un `code: string` único e inmutable (constante de cadena literal)
- Pasa el mensaje descriptivo al constructor de `Error`

```typescript
// Definición
export abstract class DomainError extends Error {
  public abstract readonly code: string;
  constructor(message: string) { super(message); }
}

// Uso concreto
export class CredencialesInvalidasError extends DomainError {
  public readonly code = 'CREDENCIALES_INVALIDAS';
  constructor() { super('Email o contraseña incorrectos.'); }
}
```

**Beneficio:** Nunca se hace `catch (e) { if (e.message.includes('...'))` — se hace `if (error.code === 'CREDENCIALES_INVALIDAS')`. Determinista, independiente del idioma del mensaje.

### 3.2 `Result<T, E>`

[`Result.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/shared-kernel/src/Result.ts)

Patrón Result (también conocido como Either/Railway-oriented programming). Elimina el uso de excepciones como mecanismo de control de flujo en el dominio.

```typescript
// Éxito
return Result.ok(tokens);

// Fallo
return Result.fail(new CredencialesInvalidasError());

// Consumo
const result = await loginUseCase.execute(input);
if (result.isSuccess) {
  const tokens = result.value; // Access Token + Refresh Token
} else {
  const error = result.error; // DomainError con .code y .message
}
```

**Beneficio:** Los casos de uso nunca lanzan excepciones para condiciones de negocio. La capa de presentación siempre recibe un `Result` tipado y predecible.

---

## 4. Base de Datos

### 4.1 Esquema (Drizzle ORM)

**Ruta:** `packages/database/src/schema/autenticacion.schema.ts`

Tablas del módulo de autenticación definidas con Drizzle ORM, idénticas en estructura al script SQL de referencia (`docs/database/WARENGINE_FULL_BD.sql`):

| Tabla | Propósito |
|---|---|
| `roles` | Define los 3 roles del sistema: `super-admin`, `admin-sucursal`, `cajero-vendedor` |
| `permisos` | Catálogo de 26 permisos en formato `modulo:accion` (ej. `facturacion:facturar`) |
| `rol_permisos` | Tabla puente N:N que asigna permisos a roles |
| `usuarios` | Cuentas de acceso (vinculadas a un empleado via FK) |
| `usuario_sucursales` | N:N para asignar sucursales autorizadas a cada usuario |
| `refresh_tokens` | Tokens de renovación de sesión (con hash, expiran en 7 días) |
| `password_reset_tokens` | Tokens de un solo uso para recuperación de contraseña |
| `intentos_login` | Auditoría de intentos (incluye emails inexistentes, sin FK intencionalmente) |

> **Nota técnica:** La columna `codigo` en `permisos` y `password_hash` en `usuarios` usan el tipo personalizado `varcharBin` — definido en [`column-types.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/schema/column-types.ts) — que fuerza `COLLATE utf8mb4_bin` para comparaciones binarias exactas (case-sensitive y byte-exact).

### 4.2 Seeds

#### `autenticacion.seed.ts`

[`autenticacion.seed.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/seeds/autenticacion.seed.ts)

Inserta (de forma idempotente) los datos maestros del sistema:

- **3 Roles** con sus descripciones
- **26 Permisos** granulares cubriendo 6 módulos (`autenticacion`, `inventario`, `facturacion`, `administracion`, `logistica`, `mcp`)
- **Asignaciones rol-permiso** siguiendo el principio de mínimo privilegio:

| Rol | Permisos clave |
|---|---|
| `cajero-vendedor` | Leer inventario, emitir facturas, consultar, acceso MCP básico |
| `admin-sucursal` | Todo lo anterior + gestionar personal, anular facturas, ajustar stock, métricas locales |
| `super-admin` | Todos los 26 permisos del sistema |

La idempotencia se logra con `onDuplicateKeyUpdate` de Drizzle, lo que permite re-ejecutar el seed sin duplicar datos ni reiniciar IDs.

#### `super-admin.seed.ts`

[`super-admin.seed.ts`](file:///c:/Users/USUARIO/Desktop\WARENGINE\BACK\packages\database\src\seeds\super-admin.seed.ts)

Solo se ejecuta en entorno `development`. Crea el primer usuario administrador con máxima seguridad:

1. Lee la contraseña **exclusivamente** de `SEED_SUPERADMIN_PASSWORD` (aborta si no existe o tiene < 12 caracteres)
2. Crea la sucursal-sistema (id=1) si no existe
3. Crea el empleado-sistema vinculado
4. Aplica **Argon2id** al hash antes de persistir
5. Es idempotente: re-ejecuciones solo actualizan el hash

---

## 5. Core

El corazón de la arquitectura. No contiene ninguna dependencia a Drizzle, HTTP ni JWT. Solo TypeScript + shared-kernel.

### 5.1 Entidad `Usuario`

[`Usuario.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/domain/entities/Usuario.ts)

Entidad de dominio con un método crítico de seguridad:

```typescript
public credencialesFueronInvalidadas(tokenIat: Date): boolean {
  if (!this.tokensInvalidadosEn) return false;
  // Si el token se emitió ANTES o EN EL MISMO INSTANTE de la invalidación → inválido
  return tokenIat <= this.tokensInvalidadosEn;
}
```

Este método garantiza que si un administrador revoca todas las sesiones de un usuario (por ejemplo, ante robo de cuenta), ningún token emitido antes de ese momento pueda seguir funcionando — incluso si aún no ha expirado.

### 5.2 Errores de Dominio

[`AutenticacionErrors.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/domain/errors/AutenticacionErrors.ts)

| Clase | Código | HTTP resultante | Cuándo se usa |
|---|---|---|---|
| `CredencialesInvalidasError` | `CREDENCIALES_INVALIDAS` | 401 | Email no existe o contraseña incorrecta (mismo error intencional para no revelar cuál falló) |
| `UsuarioInactivoError` | `USUARIO_INACTIVO` | 401 | Usuario desactivado intentando iniciar sesión |
| `PermisoDenegadoError` | `PERMISO_DENEGADO` | 403 | Token válido pero el rol no tiene el permiso requerido |
| `TokenInvalidoError` | `TOKEN_INVALIDO` | 401 | JWT inválido, expirado, revocado o credenciales invalidadas |
| `Requiere2FAError` | `REQUIERE_2FA` | 428 | Usuario con 2FA activado (flujo pendiente) |

### 5.3 Ports (Interfaces)

Los ports son los contratos que el Core necesita del mundo exterior. **El Core no sabe quién los implementa.**

#### Repositorios

| Interface | Métodos | Propósito |
|---|---|---|
| [`IUsuarioRepository`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/domain/repositories/IUsuarioRepository.ts) | `findByEmail`, `findById` | Buscar usuarios en la BD |
| [`IRolRepository`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/domain/repositories/IRolRepository.ts) | `obtenerPermisosDeRol` | Obtener lista de permisos por rol |
| [`IRefreshTokenRepository`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/domain/repositories/IRefreshTokenRepository.ts) | `guardar`, `validar`, `revocar` | Gestionar tokens de renovación |

#### Servicios

| Interface | Métodos | Propósito |
|---|---|---|
| [`ITokenService`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/domain/services/ITokenService.ts) | `generarTokens`, `validarAccessToken`, `validarRefreshToken`, `revocarRefreshToken` | Operaciones con JWT |
| [`IPasswordService`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/domain/services/IPasswordService.ts) | `comparar`, `hashear` | Verificación y hash de contraseñas |

### 5.4 Casos de Uso

#### `LoginUseCase`

[`LoginUseCase.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/application/use-cases/LoginUseCase.ts)

**Dependencias:** `IUsuarioRepository`, `IPasswordService`, `ITokenService`

```
Request: { email, passwordPlain }

1. Buscar usuario por email
   └─ Si no existe → CREDENCIALES_INVALIDAS (intencionalmente igual al error de contraseña)
2. Verificar que el usuario esté activo
   └─ Si no → USUARIO_INACTIVO
3. Comparar contraseña con Argon2
   └─ Si no coincide → CREDENCIALES_INVALIDAS
4. Verificar si requiere 2FA
   └─ Si sí → REQUIERE_2FA (flujo pendiente de implementar)
5. Generar par de tokens (Access + Refresh)
   └─ Devolver Result.ok({ accessToken, refreshToken })
```

#### `ValidarPermisoUseCase`

[`ValidarPermisoUseCase.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/application/use-cases/ValidarPermisoUseCase.ts)

**Dependencias:** `ITokenService`, `IUsuarioRepository`, `IRolRepository`

```
Request: { accessToken, permisoRequerido? }

1. Verificar firma y expiración del JWT (via ITokenService)
   └─ Si falla → TOKEN_INVALIDO
2. Buscar usuario por ID extraído del payload
   └─ Si no existe → TOKEN_INVALIDO
3. Verificar tokens_invalidados_en contra iat del token ← CRÍTICO
   └─ Si iat <= tokens_invalidados_en → TOKEN_INVALIDO
4. Si se requiere un permiso específico:
   └─ Obtener permisos del rol del usuario
   └─ Si no incluye el permiso → PERMISO_DENEGADO
5. Devolver Result.ok() — el usuario está autorizado
```

#### `RenovarTokenUseCase`

[`RenovarTokenUseCase.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/src/autenticacion/application/use-cases/RenovarTokenUseCase.ts)

**Dependencias:** `ITokenService`, `IUsuarioRepository`

```
Request: { refreshToken }

1. Validar el refresh token en BD (no expirado, no revocado)
   └─ Si falla → TOKEN_INVALIDO
2. Buscar usuario asociado
   └─ Si no existe → TOKEN_INVALIDO
3. Verificar que el usuario siga activo
   └─ Si no → USUARIO_INACTIVO
4. Revocar el refresh token actual (rotación — previene replay attacks)
5. Generar nuevo par de tokens
   └─ Devolver Result.ok({ accessToken, refreshToken })
```

---

## 6. Platform

**Ruta:** `packages/platform/src/`  
**Propósito:** Implementaciones técnicas de los ports definidos en Core. No contiene lógica de negocio.

### 6.1 `Argon2PasswordHasher`

[`argon2-password-hasher.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/platform/src/hashing/argon2-password-hasher.ts)

Implementa `IPasswordService` usando **Argon2id** (ganador de la Password Hashing Competition 2015).

- `hashear(plain)` → genera un hash con salt aleatorio
- `comparar(plain, hash)` → verifica de forma segura (timing-safe)
- El `try/catch` interno convierte cualquier error de verificación en `false` — nunca expone detalles del fallo

### 6.2 `JwtTokenService`

[`jwt-token-service.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/platform/src/jwt/jwt-token-service.ts)

Implementa `ITokenService` usando **Jose** (estándar JOSE para JWT):

**Access Token:** firmado con HMAC-SHA256 (`HS256`), expira en 15 minutos.

```typescript
// Payload del Access Token
{
  usuarioId: string,  // UUID del usuario
  rolId: number,       // ID del rol (para queries de permisos)
  iat: timestamp,      // Fecha de emisión — crucial para tokens_invalidados_en
  exp: timestamp       // Fecha de expiración (15 min)
}
```

**Refresh Token:** no es JWT — es un UUID aleatorio almacenado en BD con hash. Al validar, se busca en la tabla `refresh_tokens` verificando que no esté revocado ni expirado.

**Rotación de Refresh Tokens:** `revocarRefreshToken` marca el token como `revocado=1` en BD, de modo que si un atacante roba el refresh token, al intentar usarlo una vez, el token legítimo ya fue rotado e invalidado el del atacante.

---

## 7. Database (Repositorios)

**Ruta:** `packages/database/src/repositories/autenticacion/`  
**Propósito:** Implementar los ports de Core usando Drizzle ORM.

### 7.1 `DrizzleUsuarioRepository`

[`drizzle-usuario.repository.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/repositories/autenticacion/drizzle-usuario.repository.ts)

Implementa `IUsuarioRepository`. Las queries usan `eq()` de Drizzle (type-safe, previene SQL injection).

### 7.2 `DrizzleRolRepository`

[`drizzle-rol.repository.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/repositories/autenticacion/drizzle-rol.repository.ts)

Implementa `IRolRepository`. Hace un `INNER JOIN` entre `rol_permisos` y `permisos` para obtener los códigos de permisos de un rol, devolviendo solo los strings (`string[]`).

### 7.3 `DrizzleRefreshTokenRepository`

[`drizzle-refresh-token.repository.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/repositories/autenticacion/drizzle-refresh-token.repository.ts)

Implementa `IRefreshTokenRepository`. Gestiona el ciclo de vida de los refresh tokens en BD:
- `guardar`: inserta con fecha de expiración
- `validar`: busca por token + `revocado=0`, verifica que `new Date() < expira_en`
- `revocar`: hace `UPDATE SET revocado=1`

### 7.4 `usuario.mapper.ts`

[`usuario.mapper.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/mappers/autenticacion/usuario.mapper.ts)

Función pura que convierte una fila de la tabla `usuarios` (tipo `UsuarioRecord` de Drizzle) en una instancia de la entidad de dominio `Usuario`. Convierte los campos `tinyint` (`is_active`, `requiere_2fa`) a `boolean`.

---

## 8. Composition

**Ruta:** `packages/composition/src/container.ts`  
[`container.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/composition/src/container.ts)

El **Composition Root** es el único lugar del monorepo donde todas las capas se conocen entre sí. Aquí se construye el árbol de dependencias completo:

```
createContainer()
│
├── db = getDatabase()                          [database/client.ts]
│
├── usuarioRepository = DrizzleUsuarioRepository(db)
├── rolRepository = DrizzleRolRepository(db)
├── refreshTokenRepository = DrizzleRefreshTokenRepository(db)
│
├── tokenService = JwtTokenService(refreshTokenRepository)
│   └─ nota: JwtTokenService necesita IRefreshTokenRepository para
│      guardar/revocar los refresh tokens al emitir/rotar.
│      Platform depende de Core (port), no de Database (implementación).
│
├── passwordHasher = Argon2PasswordHasher()
│
├── loginUseCase = LoginUseCase(usuarioRepository, passwordHasher, tokenService)
├── validarPermisoUseCase = ValidarPermisoUseCase(tokenService, usuarioRepository, rolRepository)
└── renovarTokenUseCase = RenovarTokenUseCase(tokenService, usuarioRepository)
```

**Principio aplicado:** Ningún módulo de `apps/` importa directamente de `database` o `platform`. Solo consumen el `AppContainer` tipado.

---

## 9. API REST

**Ruta:** `apps/api/src/`  
**Framework:** Hono (ultraligero, compatible con Deno nativo)

### 9.1 `main.ts`

[`main.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/apps/api/src/main.ts)

Punto de entrada de la API. Únicamente:
1. Instancia el contenedor: `createContainer()`
2. Configura el middleware global de CORS con `credentials: true` (indispensable para admitir cookies seguras `HttpOnly` desde el frontend Next.js)
3. Registra las rutas por módulo
4. Arranca el servidor en el puerto 8017 (`http://localhost:8017`)

### 9.2 Rutas

[`autenticacion.routes.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/apps/api/src/routes/autenticacion.routes.ts)

| Método | Ruta | Caso de uso / Acción | Requiere Auth | Descripción |
|---|---|---|---|---|
| `POST` | `/auth/login` | `LoginUseCase` | ❌ | Emite cookies `HttpOnly` y devuelve JSON con tokens |
| `POST` | `/auth/renovar-token` | `RenovarTokenUseCase` | ❌ | Rota el RT (acepta cookie `refresh_token` o JSON body) |
| `POST` | `/auth/logout` | `logoutController` | ❌ | Elimina las cookies `access_token` y `refresh_token` |
| `GET` | `/auth/verificar` | `ValidarPermisoUseCase` | ✅ | Verifica si la sesión actual (vía cookie o Bearer) es válida |

### 9.3 Gestión de Cookies Seguras (`cookie.ts`)

[`cookie.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/apps/api/src/utils/cookie.ts)

Implementa la directriz de seguridad estipulada en la **Sección 7.2 de `proyecto-warengine.md`**:

* **`access_token`**: Cookie con vigencia de 15 minutos (`maxAge: 900`).
* **`refresh_token`**: Cookie con vigencia de 7 días (`maxAge: 604800`).
* **Atributos de seguridad aplicados**:
  * `httpOnly: true`: El código JavaScript en el navegador no tiene acceso a las cookies, eliminando el riesgo de robo por vulnerabilidades Cross-Site Scripting (XSS).
  * `sameSite: 'Lax'`: Protege contra ataques Cross-Site Request Forgery (CSRF).
  * `secure: isProduction`: Se activa obligatoriamente bajo HTTPS en entornos productivos.
  * `path: '/'`: Disponible para toda la API.

### 9.4 Controladores

Los controladores siguen un patrón estricto:

```
1. Parsear datos (body JSON o cookies de sesión)
2. Validar con el esquema Zod del módulo (@warengine/contracts)
   └─ Si falla → 400 { error: 'VALIDATION_ERROR', issues: [...] }
3. Ejecutar el caso de uso (Clean Architecture)
4. Si es exitoso, emitir/actualizar las cookies de sesión (setAuthCookies)
5. Pasar el Result al presenter
```

| Archivo | Ruta |
|---|---|
| [`login.controller.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/apps/api/src/controllers/autenticacion/login.controller.ts) | `POST /auth/login` |
| [`renovar-token.controller.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/apps/api/src/controllers/autenticacion/renovar-token.controller.ts) | `POST /auth/renovar-token` |
| [`logout.controller.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/apps/api/src/controllers/autenticacion/logout.controller.ts) | `POST /auth/logout` |

### 9.5 Presenter (`result.presenter.ts`)

[`result.presenter.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/apps/api/src/presenters/result.presenter.ts)

Función centralizada que traduce `Result<T, DomainError>` a una respuesta HTTP:

| `error.code` | HTTP Status | Significado |
|---|---|---|
| `CREDENCIALES_INVALIDAS`, `USUARIO_INACTIVO`, `TOKEN_INVALIDO` | 401 | No autorizado |
| `PERMISO_DENEGADO` | 403 | Prohibido |
| `REQUIERE_2FA` | 428 | Precondición requerida |
| Cualquier otro | 400 | Error de negocio genérico |
| Éxito | 200 (o el código pasado) | `{ ...valor }` |

### 9.6 Middleware de Autorización (`auth.middleware.ts`)

[`auth.middleware.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/apps/api/src/middlewares/auth.middleware.ts)

Middleware híbrido que soporta tanto clientes web basados en cookies como herramientas API:
1. **Prioridad 1**: Intenta leer el token desde la cookie segura `access_token`.
2. **Prioridad 2 (Fallback)**: Si no hay cookie, extrae el token de la cabecera `Authorization: Bearer <token>`.
3. Llama a `ValidarPermisoUseCase` con el token y el permiso requerido (opcional).
4. Comprueba firma, expiración, estado activo (`is_active = 1`), `tokens_invalidados_en` y permisos de rol.
5. Si pasa → `next()`. Si falla → responde con el código de error correspondiente.

---

## 10. RBAC — Control de Acceso Basado en Permisos

El sistema implementa RBAC **por permisos** (no por rol). Esto significa que el código nunca hace `if (usuario.rol === 'admin')`, sino `if (usuario.tienePermiso('facturacion:anular'))`.

### Formato de permisos

```
{modulo}:{accion}
```

### Catálogo completo

| Módulo | Código | Descripción |
|---|---|---|
| **autenticacion** | `autenticacion:gestionar-usuarios` | Crear/desactivar usuarios |
| | `autenticacion:asignar-roles` | Asignar roles |
| | `autenticacion:ver-auditoria` | Ver logs de login |
| **inventario** | `inventario:leer` | Consultar catálogo y stock |
| | `inventario:escribir` | Crear/editar productos |
| | `inventario:registrar-movimiento` | Registrar compras/salidas |
| | `inventario:ajustar-stock` | Ajustes de inventario |
| | `inventario:ver-kardex` | Historial de movimientos |
| **facturacion** | `facturacion:facturar` | Emitir facturas y cobrar |
| | `facturacion:anular` | Anular facturas |
| | `facturacion:devolucion` | Registrar devoluciones |
| | `facturacion:consultar` | Ver histórico |
| | `facturacion:gestionar-clientes` | CRUD de clientes |
| **administracion** | `administracion:gestionar-sucursales` | Config de sucursales |
| | `administracion:gestionar-personal` | CRUD empleados |
| | `administracion:gestionar-salarios` | Cambios salariales |
| | `administracion:ver-metricas-sucursal` | Dashboard local |
| | `administracion:ver-metricas-globales` | Dashboard global |
| | `administracion:gestionar-alertas` | Ver/atender alertas |
| **logistica** | `logistica:leer` | Consultar activos |
| | `logistica:gestionar-activos` | CRUD activos fijos |
| | `logistica:asignar-activos` | Asignar/recibir activos |
| | `logistica:mantenimiento` | Registrar mantenimientos |
| **mcp** | `mcp:consultar` | Tools de consulta IA |
| | `mcp:ejecutar-herramientas` | Tools operativas IA |
| | `mcp:herramientas-financieras` | Tools analíticas globales |

### Asignación por rol

```
cajero-vendedor   ─── 6 permisos  (operativa básica)
admin-sucursal    ─── 19 permisos (gestión completa local)
super-admin       ─── 26 permisos (control total)
```

---

## 11. Flujos de Datos Extremo a Extremo

### Login exitoso

```
Cliente
  POST /auth/login  { email, password }
    ↓
login.controller.ts
  → Valida con loginSchema (Zod)
  → loginUseCase.execute({ email, passwordPlain })
      ↓
      LoginUseCase
        → IUsuarioRepository.findByEmail()
            ↓ DrizzleUsuarioRepository → MySQL
            ↑ fila → usuario.mapper.ts → entidad Usuario
        → IPasswordService.comparar(plain, hash)
            ↓ Argon2PasswordHasher → argon2.verify()
        → ITokenService.generarTokens(id, rolId)
            ↓ JwtTokenService
              → SignJWT (Jose) → accessToken
              → crypto.randomUUID() → refreshToken
              → IRefreshTokenRepository.guardar() → MySQL
      ↑ Result.ok({ accessToken, refreshToken })
    ↓
result.presenter.ts
  → HTTP 200 { accessToken, refreshToken }
    ↓
Cliente almacena tokens
```

### Verificación de permiso en endpoint protegido

```
Cliente
  GET /inventario/productos
  Authorization: Bearer <accessToken>
    ↓
auth.middleware(container, 'inventario:leer')
  → validarPermisoUseCase.execute({ token, permiso })
      ↓
      ValidarPermisoUseCase
        → ITokenService.validarAccessToken(token)
            ↓ JwtTokenService → jwtVerify (Jose)
            ↑ { usuarioId, rolId, iat }
        → IUsuarioRepository.findById(usuarioId)
            ↓ MySQL
        → usuario.credencialesFueronInvalidadas(iat) ← REGLA CRÍTICA
        → IIRolRepository.obtenerPermisosDeRol(rolId)
            ↓ MySQL JOIN rol_permisos + permisos
        → permisos.includes('inventario:leer')
      ↑ Result.ok()
  → next() → controlador ejecuta el caso de uso del módulo
```

---

## 12. Pruebas Unitarias

**Ruta:** `packages/core/tests/autenticacion/`  
**Herramienta:** `Deno.test` + `jsr:@std/assert`  
**Estrategia:** Mocks manuales de todos los ports (sin BD, sin JWT real, sin Argon2)

| Archivo | Tests | Qué se verifica |
|---|---|---|
| [`usuario.entity.test.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/tests/autenticacion/usuario.entity.test.ts) | 4 | La lógica de `tokens_invalidados_en` con los 3 casos límite |
| [`login.use-case.test.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/tests/autenticacion/login.use-case.test.ts) | 5 | Email inexistente, contraseña incorrecta, usuario inactivo, 2FA, éxito |
| [`validar-permiso.use-case.test.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/tests/autenticacion/validar-permiso.use-case.test.ts) | 6 | Permiso denegado, token inválido, credenciales revocadas, sin permiso requerido, usuario inactivo, éxito |
| [`renovar-token.use-case.test.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/core/tests/autenticacion/renovar-token.use-case.test.ts) | 4 | RT inválido, usuario inexistente, usuario inactivo, rotación exitosa |

**Total: 19 tests · 0 fallos · tiempo de ejecución < 500ms**

```bash
deno test --allow-env packages/core/tests/autenticacion/
```

---

## 13. Scripts de Arranque

**Ruta:** `packages/database/src/seeds/`

| Script | Descripción |
|---|---|
| [`run.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/seeds/run.ts) | Orquestador: ejecuta `seedAutenticacion` siempre, y `crearSuperAdminInicial` solo si `NODE_ENV=development` |
| [`autenticacion.seed.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/seeds/autenticacion.seed.ts) | Inserta roles, permisos y asignaciones (idempotente) |
| [`super-admin.seed.ts`](file:///c:/Users/USUARIO/Desktop/WARENGINE/BACK/packages/database/src/seeds/super-admin.seed.ts) | Crea el primer usuario super-admin con contraseña de variable de entorno |

```bash
# Solo roles y permisos
deno task seed

# Todo (incluyendo super-admin) en development
SEED_SUPERADMIN_PASSWORD=MiClave.Segura2026! deno task seed:dev
```

---

## 14. Variables de Entorno

| Variable | Requerida | Descripción |
|---|---|---|
| `DB_HOST` | ✅ | Host de MySQL (ej. `localhost`) |
| `DB_PORT` | ✅ | Puerto (default: `3306`) |
| `DB_NAME` | ✅ | Nombre de la BD (`warengine`) |
| `DB_USER` | ✅ | Usuario de MySQL |
| `DB_PASSWORD` | ✅ | Contraseña del usuario |
| `JWT_SECRET` | ✅ | Mínimo 32 caracteres aleatorios. Firman todos los Access Tokens |
| `NODE_ENV` | ⚡ | `development` activa el seed del super-admin |
| `SEED_SUPERADMIN_PASSWORD` | ⚡ | Contraseña inicial del super-admin (solo en `development`, mín. 12 chars) |

---

## 15. Reglas de Seguridad Críticas

> [!IMPORTANT]
> Estas reglas deben respetarse en cualquier cambio futuro sobre este módulo.

1. **`tokens_invalidados_en` se valida en CADA petición.** El middleware `authMiddleware` usa `ValidarPermisoUseCase` que compara `iat <= tokens_invalidados_en`. Si se omite esta verificación, un token robado puede usarse indefinidamente aunque el administrador haya revocado las sesiones.

2. **Mismo error para email inexistente y contraseña incorrecta.** `LoginUseCase` devuelve `CREDENCIALES_INVALIDAS` en ambos casos. Nunca revelar cuál de las dos condiciones falló (user enumeration attack).

3. **Rotación de Refresh Tokens.** Cada renovación revoca el token anterior antes de emitir el nuevo. Si un atacante roba un refresh token, al intentar usarlo el token legítimo ya estará en otro token y el del atacante quedará revocado.

4. **`totp_secret` debe cifrarse, nunca hashearse.** Es un valor que necesita ser recuperado (reversible) para verificar los códigos TOTP. Use AES-256-GCM. (Pendiente de implementar en la fase de 2FA.)

5. **La contraseña del super-admin NUNCA se hardcodea.** Solo se acepta desde `SEED_SUPERADMIN_PASSWORD`. El script aborta si no existe.

6. **`nodeModulesDir: auto` en `deno.json`.** Argon2 es una librería nativa (addon de Node.js) que requiere compilar bindings. Esta configuración permite que Deno maneje el directorio `node_modules` correctamente para librerías con código nativo.

7. **`--allow-ffi` es requerido para Argon2.** Cualquier comando que ejecute código que usa Argon2 debe incluir este flag.

8. **Autenticación con Cookies HttpOnly y SameSite=Lax (Sección 7.2 de arquitectura).** Los tokens de sesión se transmiten y almacenan en cookies `HttpOnly` para evitar su lectura desde JavaScript (eliminando el riesgo de ataques XSS) y con `SameSite=Lax` para mitigar ataques CSRF. En producción se activa el flag `Secure` bajo HTTPS.

9. **Comprobación de usuario activo (`is_active = 1`).** `ValidarPermisoUseCase` comprueba que el usuario no haya sido desactivado (`is_active = 0`) en cada petición antes de evaluar permisos o fechas de revocación, respondiendo `401 Unauthorized` de inmediato si fue dado de baja.

