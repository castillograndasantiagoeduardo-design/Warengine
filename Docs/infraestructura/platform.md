# Plataforma Técnica (`@warengine/platform`)

Este documento describe la arquitectura, adaptadores técnicos e implementaciones de infraestructura sin lógica de negocio contenidas en `Backend/packages/platform`.

---

## 1. Propósito y Reglas de Diseño

El paquete `platform` provee la "fontanería" técnica del backend. Implementa los puertos técnicos definidos en `@warengine/core` (`IPasswordService`, `ITokenService`) utilizando librerías especializadas (`argon2`, `jose`).

### Reglas de Aislamiento
- **Cero lógica de negocio:** Ningún archivo de este paquete puede conocer conceptos de dominio como `Factura`, `Producto`, `Sucursal` o `Cliente`.
- **Implementación de Puertos:** Solo satisface interfaces técnicas declaradas en `packages/core/src/modules/*/application/ports/`.
- **Validación defensiva de configuración:** Rechaza iniciar servicios con parámetros inseguros (por ejemplo, secretos criptográficos débiles).

---

## 2. Componentes Implementados en el Working Tree

El módulo expone sus adaptadores a través de [`Backend/packages/platform/mod.ts`](../../Backend/packages/platform/mod.ts):

### 2.1 Hashing de Contraseñas con Argon2
Ubicación: [`Backend/packages/platform/src/hashing/argon2-password-hasher.ts`](../../Backend/packages/platform/src/hashing/argon2-password-hasher.ts)

Implementa la interfaz `IPasswordService`:

```typescript
export class Argon2PasswordHasher implements IPasswordService {
  public async hashear(plain: string): Promise<string>;
  public async comparar(plain: string, hash: string): Promise<boolean>;
}
```

- Utiliza el algoritmo estándar de la industria **Argon2id** mediante la librería `argon2`.
- El método `comparar` captura internamente cualquier excepción del algoritmo y retorna `false` en caso de fallo, garantizando resistencia ante excepciones inesperadas.

### 2.2 Gestión de Tokens JWT y Refresh Tokens (`JwtTokenService`)
Ubicación: [`Backend/packages/platform/src/jwt/jwt-token-service.ts`](../../Backend/packages/platform/src/jwt/jwt-token-service.ts)

Implementa la interfaz `ITokenService`:

```typescript
export class JwtTokenService implements ITokenService {
  constructor(
    private readonly refreshTokenRepo: IRefreshTokenRepository,
    jwtSecret: string | Uint8Array,
  );

  public async generarTokens(usuarioId: string, rolId: number): Promise<AuthTokens>;
  public async validarAccessToken(token: string): Promise<AccessTokenPayload>;
  public async validarRefreshToken(token: string): Promise<{ usuarioId: string }>;
  public async revocarRefreshToken(token: string): Promise<void>;
}
```

- **Librería Criptográfica:** Emplea `jose` (`SignJWT` y `jwtVerify`).
- **Access Token:**
  - Algoritmo: `HS256`.
  - Claims incluidos: `usuarioId` (UUID string), `rolId` (entero), `iat` (issued at).
  - Tiempo de vida (TTL): **15 minutos** (`'15m'`).
- **Refresh Token:**
  - Formato: UUID criptográfico aleatorio (`crypto.randomUUID()`).
  - Tiempo de vida: **7 días**.
  - Delegación: Delega la persistencia y validación al repositorio `IRefreshTokenRepository` (el cual computa un hash SHA-256 antes de guardar en MySQL).
- **Validación de Secreto:** En el constructor valida estrictamente que `jwtSecret` tenga una longitud de al menos 32 caracteres/bytes.

### 2.3 Validación de Configuración JWT
Ubicación: [`Backend/packages/platform/src/config/jwt.config.ts`](../../Backend/packages/platform/src/config/jwt.config.ts)

Función utilitaria `obtenerJwtSecret(env?)`:
- Inspecciona `env['JWT_SECRET']` o `Deno.env.get('JWT_SECRET')`.
- Si no está definida o su longitud es inferior a 32 caracteres, lanza una excepción impidiendo el arranque del servidor.

---

## 3. Estado de Adaptadores: Implementados vs. Stubs

| Adaptador / Subcarpeta | Estado en Código | Detalle / Observación |
| :--- | :---: | :--- |
| `hashing/` | **IMPLEMENTADO** | `Argon2PasswordHasher` en producción. |
| `jwt/` | **IMPLEMENTADO** | `JwtTokenService` con `jose` (HS256, 15m). |
| `config/` | **IMPLEMENTADO** | `jwt.config.ts` valida `JWT_SECRET` (>= 32 chars). |
| `logger/` | **STUB (`.gitkeep`)** | Pendiente. La aplicación utiliza `console.error` o captura básica. |
| `mailer/` | **STUB (`.gitkeep`)** | Pendiente. Requerido para el flujo de recuperación de contraseña (RF-AUTH-05). |
| `rate-limit/` | **STUB (`.gitkeep`)** | El control de intentos de login se implementó en `core/application/use-cases/LoginUseCase.ts` y `IControlIntentosLogin` sobre la tabla `intentos_login`. |
| `totp/` | **STUB (`.gitkeep`)** | Pendiente. Requerido para doble factor de autenticación TOTP (RF-AUTH-04). |

---

## 4. Pruebas Unitarias del Paquete

El paquete incluye su propia suite de pruebas en `Backend/packages/platform/tests/`:
- `jwt-token-service.test.ts`: Verifica la emisión y validación de access tokens, expiración y rechazo de secretos menores a 32 caracteres.
- `jwt.config.test.ts`: Valida los escenarios de variables de entorno ausentes, demasiado cortas o válidas.
