# Infraestructura: API REST (`Backend/apps/api`)

> **Aplicación:** `Backend/apps/api`  
> **Framework:** [Hono v4](https://hono.dev/) sobre Deno runtime.  
> **Puerto:** `8017` (hardcoded en `Deno.serve`).  
> **Dependencias:** `@warengine/composition`, `@warengine/shared-kernel`, `@warengine/contracts`, `hono`.

---

## 1. Propósito y Estructura

La API REST actúa como la capa de entrega HTTP de Warengine. Su responsabilidad es estrictamente de transporte:
- Enrutamiento de peticiones HTTP.
- Validación sintáctica de payloads entrantes con esquemas Zod (de `@warengine/contracts`).
- Autenticación y autorización basada en cookies y permisos granulares.
- Invocación de casos de uso y traducción de resultados de dominio (`Result<T, DomainError>`) a códigos de estado HTTP estándar mediante un presenter unificado.
- Manejo de excepciones no controladas mediante manejadores seguros (`safeHandler`).

```
Backend/apps/api/
├── deno.json
├── README.md
└── src/
    ├── main.ts                         # Servidor Hono, CORS y montaje de rutas
    ├── controllers/                    # Controladores HTTP por módulo
    ├── middlewares/                    # Middleware de autenticación y autorización
    ├── presenters/                     # Traducción de Result a HTTP Response
    ├── routes/                         # Definición de endpoints por módulo
    └── utils/                          # Cookies, IP, actor, identidad, handler seguro
```

---

## 2. Servidor Principal: `main.ts`

- **Archivo:** [`Backend/apps/api/src/main.ts`](../../Backend/apps/api/src/main.ts)
- **Configuración CORS (RF-SA-D3):**
  - Orígenes permitidos leídos de la variable de entorno `CORS_ORIGENES` (default: `'http://localhost:3000'`).
  - Lista separada por comas parseada y saneada.
  - Comprobación dinámica: solo orígenes exactos en la lista son aceptados con `credentials: true`.
  - Métodos permitidos: `['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']`.
  - Cabeceras permitidas: `['Content-Type', 'Authorization']`.
- **Ruta de Diagnóstico:** `GET /health` responde con texto plano `'Warengine API - OK'`.
- **Montaje de Prefijos de Módulos:**
  - `/auth` -> [`createAutenticacionRoutes(container)`](../../Backend/apps/api/src/routes/autenticacion.routes.ts)
  - `/administracion` -> [`createAdministracionRoutes(container)`](../../Backend/apps/api/src/routes/administracion.routes.ts)
  - `/ventas` -> [`createFacturacionRoutes(container)`](../../Backend/apps/api/src/routes/facturacion.routes.ts) *(Nota: prefijo `/ventas`, cubre clientes y turnos)*
  - `/inventario` -> [`createInventarioRoutes(container)`](../../Backend/apps/api/src/routes/inventario.routes.ts)

---

## 3. Seguridad y Middlewares

### 3.1 Middleware de Autorización: `authMiddleware`
- **Archivo:** [`Backend/apps/api/src/middlewares/auth.middleware.ts`](../../Backend/apps/api/src/middlewares/auth.middleware.ts)
- **Firma:** `authMiddleware(container: AppContainer, permisoRequerido?: string)`
- **Mecanismo de Extracción de Token:**
  1. **Prioridad 1:** Cookie HttpOnly `access_token`.
  2. **Prioridad 2 (Respaldo):** Cabecera `Authorization: Bearer <token>`.
  3. Si no existe en ninguno: Retorna inmediatamente HTTP `401 Unauthorized`:
     ```json
     { "error": "UNAUTHORIZED", "message": "Falta token de autorización" }
     ```
- **Validación:**
  - Invoca `container.autenticacion.validarPermiso.execute(...)`.
  - Transmite la IP remota real (obtenida mediante `obtenerIp(c)`), método HTTP y ruta.
  - Si falla la verificación de firma o el usuario carece del permiso, delega la respuesta a `presentResult` (HTTP 401 o 403).
  - Si es exitoso, almacena el objeto de identidad en el contexto de Hono bajo la clave `identidad` accesible con `obtenerIdentidad(c)`.

### 3.2 Gestión de Cookies de Sesión: `cookie.ts`
- **Archivo:** [`Backend/apps/api/src/utils/cookie.ts`](../../Backend/apps/api/src/utils/cookie.ts)
- **Flag `secure` (RF-SA-D2):** Se evalúa como `Deno.env.get('NODE_ENV') !== 'development'`. Solo en desarrollo local con HTTP no seguro se desactiva `secure`.
- **Cookies emitidas:**
  - `access_token`: MaxAge = `900` (15 minutos), `httpOnly: true`, `sameSite: 'Lax'`, `path: '/'`.
  - `refresh_token`: MaxAge = `604800` (7 días), `httpOnly: true`, `sameSite: 'Lax'`, `path: '/'`.
- **Operaciones:**
  - `setAuthCookies(c, tokens)`: Establece ambas cookies con sus respectivos MaxAge.
  - `clearAuthCookies(c)`: Elimina ambas cookies sobreescribiéndolas con expiración inmediata.
  - `getTokensFromCookies(c)`: Lee las cookies desde la petición entrante.

---

## 4. Traductor de Errores: `result.presenter.ts`

- **Archivo:** [`Backend/apps/api/src/presenters/result.presenter.ts`](../../Backend/apps/api/src/presenters/result.presenter.ts)
- **Firma:** `presentResult<T>(c: Context, result: Result<T, DomainError>, successStatus: ContentfulStatusCode = 200)`
- **Mapeo de Códigos de Error de Dominio a HTTP Status:**

| Código de Error de Dominio | HTTP Status | Significado / Contexto |
|---|---|---|
| `CREDENCIALES_INVALIDAS` | `401 Unauthorized` | Correo o contraseña incorrectos |
| `USUARIO_INACTIVO` | `401 Unauthorized` | Cuenta desactivada por un administrador |
| `TOKEN_INVALIDO` | `401 Unauthorized` | Token expirado, manipulado o inválido |
| `PERMISO_DENEGADO` | `403 Forbidden` | Rol del usuario carece del permiso requerido |
| `CATEGORIA_NO_ENCONTRADA` | `404 Not Found` | Categoría no existe |
| `PROVEEDOR_NO_ENCONTRADO` | `404 Not Found` | Proveedor no existe |
| `SUCURSAL_NO_ENCONTRADA` | `404 Not Found` | Sucursal no existe |
| `USUARIO_NO_ENCONTRADO` | `404 Not Found` | Usuario no existe |
| `*_NO_ENCONTRADO` / `*_NO_ENCONTRADA` | `404 Not Found` | Coincidencia comodín para recursos no encontrados |
| `SKU_DUPLICADO` | `409 Conflict` | El código SKU ya está registrado |
| `STOCK_INSUFICIENTE` | `409 Conflict` | La cantidad requerida supera el stock físico |
| `TURNO_YA_ABIERTO` | `409 Conflict` | El operador ya cuenta con un turno activo |
| `REQUIERE_2FA` | `428 Precondition Required` | Segundo factor pendiente de validación |
| `LOGIN_BLOQUEADO` | `429 Too Many Requests` | Bloqueo por fuerza bruta (cuenta o IP) |
| `OPERADOR_SIN_SUCURSAL` | `422 Unprocessable Entity` | Usuario cajero sin sucursal asignada |
| `CLIENTE_B2B_DATOS_INCOMPLETOS` | `422 Unprocessable Entity` | Falta razón social o datos fiscales para cliente empresarial |
| `CATEGORIA_INACTIVA` | `422 Unprocessable Entity` | Asignación de categoría inactiva |
| `PROVEEDOR_INACTIVO` | `422 Unprocessable Entity` | Asignación de proveedor inactivo |
| `REFERENCIA_INVALIDA` | `422 Unprocessable Entity` | Clave foránea no válida en el payload |
| `SKU_MODIFICACION_NO_PERMITIDA` | `422 Unprocessable Entity` | Intento de editar el SKU una vez creado el producto |
| *Cualquier otro código* | `400 Bad Request` | Error de validación o solicitud incorrecta |

---

## 5. Utilidades Auxiliares de Transporte

### 5.1 Extracción de IP: `ip.ts`
- **Archivo:** [`Backend/apps/api/src/utils/ip.ts`](../../Backend/apps/api/src/utils/ip.ts)
- **Comportamiento:** Lee la IP directa de la conexión TCP mediante `getConnInfo(c).remote.address`.
- **Decisión de Seguridad:** Deliberadamente **NO** se lee la cabecera `X-Forwarded-For`. Cualquier cliente malicioso podría falsificar esa cabecera para engañar las reglas de rate-limiting o ensuciar las tablas de auditoría. Si en el futuro se implementa un reverse proxy (Cloudflare, Nginx), se deberá configurar una lista explícita de proxies confiables.

### 5.2 Manejo Seguro: `handler.ts`
- **Archivo:** [`Backend/apps/api/src/utils/handler.ts`](../../Backend/apps/api/src/utils/handler.ts)
- `safeHandler(fn)`: Envuelve cualquier función controladora en un bloque `try/catch`. En caso de cualquier error no previsto o excepción no capturada de runtime, previene que el servidor caiga y retorna una respuesta JSON controlada:
  ```json
  { "error": "INTERNAL_ERROR", "message": "Error procesando la solicitud" }
  ```
  con código de estado HTTP `500`.
- `leerJson(c)`: Intenta parsear `c.req.json()`. Si el cuerpo está mal formado (JSON inválido), retorna `null` para que la validación posterior de Zod devuelva un error HTTP `400` limpio en lugar de una excepción no controlada.

### 5.3 Extracción de Identidad y Actor: `identidad.ts` y `actor.ts`
- **Archivos:** [`Backend/apps/api/src/utils/identidad.ts`](../../Backend/apps/api/src/utils/identidad.ts) y [`Backend/apps/api/src/utils/actor.ts`](../../Backend/apps/api/src/utils/actor.ts)
- `obtenerIdentidad(c)`: Recupera la información del token autenticado (`usuarioId`, `rolId`). Si se invoca en un endpoint que omitió `authMiddleware`, lanza un error fatal de programación para evitar operaciones huérfanas.
- `obtenerActor(c)`: Construye el objeto `{ usuarioId, ip }` requerido por los casos de uso para asentar en los logs de auditoría.
