# Infraestructura: Plataforma Técnica (`@warengine/platform`)

> **Paquete:** `Backend/packages/platform`  
> **Dependencias externas:** `jose` (JWT), `argon2` (hashing seguro), `@warengine/core` (interfaces/ports).  
> **Regla arquitectónica:** Cero lógica de negocio. Solo adaptadores y fontanería técnica para satisfacer los puertos definidos en `core`.

---

## 1. Propósito y Responsabilidades

El paquete `@warengine/platform` proporciona las implementaciones concretas de servicios de infraestructura tecnológica que no dependen de la base de datos ni contienen reglas de dominio. 

Su función es aislar las bibliotecas de terceros y los mecanismos del sistema operativo del núcleo del dominio (`core`), implementando las interfaces de abstracción declaradas en el dominio:
- Implementación de firma y verificación de tokens (`ITokenService`).
- Implementación de derivación y validación de contraseñas (`IPasswordService`).
- Carga y validación estricta de variables de entorno de seguridad (`validarYObtenerJwtSecret`).

---

## 2. Componentes Implementados

### 2.1 Hashing de Contraseñas: `Argon2PasswordHasher`
- **Archivo:** [`Backend/packages/platform/src/hashing/argon2-password-hasher.ts`](../../Backend/packages/platform/src/hashing/argon2-password-hasher.ts)
- **Interfaz implementada:** `IPasswordService` de [`@warengine/core`](../../Backend/packages/core/src/modules/autenticacion/domain/services/IPasswordService.ts).
- **Algoritmo:** Argon2 (vía biblioteca npm `argon2`).
- **Métodos:**
  - `hashear(plain: string): Promise<string>`: Genera el hash seguro utilizando salt aleatorio embebido y parámetros recomendados contra ataques GPU/ASIC.
  - `comparar(plain: string, hash: string): Promise<boolean>`: Compara en tiempo constante la contraseña en texto plano contra el hash almacenado. Atrapa cualquier excepción interna y devuelve `false` de forma segura.

### 2.2 Gestión de Tokens: `JwtTokenService`
- **Archivo:** [`Backend/packages/platform/src/jwt/jwt-token-service.ts`](../../Backend/packages/platform/src/jwt/jwt-token-service.ts)
- **Interfaz implementada:** `ITokenService` de [`@warengine/core`](../../Backend/packages/core/src/modules/autenticacion/domain/services/ITokenService.ts).
- **Dependencias:** `jose` (`SignJWT`, `jwtVerify`) y `IRefreshTokenRepository` de [`@warengine/core`](../../Backend/packages/core/src/modules/autenticacion/domain/repositories/IRefreshTokenRepository.ts).
- **Ciclo de vida y características:**
  - **Access Token:**
    - Algoritmo: `HS256`.
    - Expiración: `15m` (15 minutos).
    - Payload: `{ usuarioId: string, rolId: number }`.
    - Claims de tiempo: `setIssuedAt()`, `setExpirationTime('15m')`.
  - **Refresh Token:**
    - Generación: Cadena opaca generada con `crypto.randomUUID()`.
    - Expiración: `7 días` desde el momento de emisión.
    - Persistencia: Se delega a `IRefreshTokenRepository.guardar(usuarioId, refreshToken, expiraEn)`, el cual aplica hash SHA-256 antes de guardar en la tabla `refresh_tokens`.
  - **Validación de Access Token:**
    - Método `validarAccessToken(token: string)`: Valida firma contra la clave secreta `Uint8Array`. Retorna `AccessTokenPayload` con `usuarioId`, `rolId` y fecha `iat`. Lanza excepción si el token está firmado con otra clave o ha expirado.
  - **Validación y Revocación de Refresh Token:**
    - Método `validarRefreshToken(token: string)`: Valida existencia y vigencia delegando en el repositorio. Lanza error `'Refresh token inválido o expirado'` si no existe o expiró.
    - Método `revocarRefreshToken(token: string)`: Marca el token como revocado delegando en el repositorio.

### 2.3 Validación de Secreto JWT: `validarYObtenerJwtSecret`
- **Archivo:** [`Backend/packages/platform/src/config/jwt.config.ts`](../../Backend/packages/platform/src/config/jwt.config.ts)
- **Función:** `validarYObtenerJwtSecret(secreto?: string): Uint8Array`
- **Regla RF-SA-D1:**
  - Si el parámetro no se proporciona, lee la variable `Deno.env.get('JWT_SECRET')`.
  - Si no existe: lanza `Error('Configuración inválida: la variable de entorno JWT_SECRET es obligatoria.')`.
  - Si tiene menos de 32 caracteres: lanza `Error('Configuración inválida: JWT_SECRET debe tener al menos 32 caracteres (longitud actual: X).')`.
  - Retorna el secreto codificado como `Uint8Array` mediante `new TextEncoder().encode(secret)` requerido por `jose`.

---

## 3. Componentes Pendientes / Reservados (Esqueletos)

Los siguientes subdirectorios existen en la estructura física pero actualmente solo contienen archivos marcadores `.gitkeep`:

| Subdirectorio | Archivo | Estado | Propósito Planificado |
|---|---|---|---|
| `src/logger/` | [`.gitkeep`](../../Backend/packages/platform/src/logger/.gitkeep) | **PENDIENTE** | Logger estructurado en formato JSON para entornos de producción, eliminando `console.log`. |
| `src/mailer/` | [`.gitkeep`](../../Backend/packages/platform/src/mailer/.gitkeep) | **PENDIENTE** | Implementación del port `Mailer` para el flujo de recuperación de contraseña de usuarios. |
| `src/rate-limit/` | [`.gitkeep`](../../Backend/packages/platform/src/rate-limit/.gitkeep) | **PENDIENTE** | Implementación de conteo y limitación de tasa por IP o cuenta en memoria o Redis (actualmente cubierto por auditoría en BD). |
| `src/totp/` | [`.gitkeep`](../../Backend/packages/platform/src/totp/.gitkeep) | **PENDIENTE** | Implementación del port `TotpService` para autenticación de dos factores (2FA / RFC 6238). |

---

## 4. Hallazgo Arquitectónico: `mod.ts` de Platform

- **Archivo:** [`Backend/packages/platform/mod.ts`](../../Backend/packages/platform/mod.ts)
- **Estado actual:** El archivo contiene únicamente un bloque de comentarios explicativos de la capa, pero no exporta ninguna clase ni función (`export *` ausente).
- **Impacto:** El consumidor principal ([`Backend/packages/composition/src/container.ts`](../../Backend/packages/composition/src/container.ts)) debe importar directamente desde las rutas internas relativas:
  ```ts
  import { JwtTokenService } from '../../platform/src/jwt/jwt-token-service.ts';
  import { Argon2PasswordHasher } from '../../platform/src/hashing/argon2-password-hasher.ts';
  import { validarYObtenerJwtSecret } from '../../platform/src/config/jwt.config.ts';
  ```
- **Solución recomendada:** Exportar `Argon2PasswordHasher`, `JwtTokenService` y `validarYObtenerJwtSecret` en `mod.ts` para que `composition` pueda importar de `@warengine/platform` de forma limpia.
