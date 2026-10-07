# ADR 0002 — Sistema Unificado de Registro de Auditoría

**Fecha:** 2026-10-07\
**Estado:** Aceptado\
**Contexto:** Anteriormente existían dos aproximaciones desconectadas para
auditoría en el backend de Warengine:

1. Administración auditaba en base de datos (`logs_auditoria`) mediante
   `IAuditor`.
2. Inventario utilizaba un segundo puerto `IAuditoriaService` implementado por
   `AuditoriaConsolaService` que solo imprimía en consola, perdiéndose la
   persistencia en base de datos.
3. Existía colisión de nombres con la interfaz `EventoAuditoria` exportada
   simultáneamente desde dos módulos en `core`.
4. La tabla `intentos_login` existía en el esquema sin persistencia en el flujo
   de autenticación.
5. Los accesos denegados no quedaban registrados a pesar del requerimiento
   RF-ADM-C11.
6. La tabla `logs_auditoria` carecía de restricciones de inmutabilidad en base
   de datos frente a `UPDATE` o `DELETE`.

---

## Decisiones

### 1. Puerto Único Transversal (`IAuditor`)

Se unificó el sistema de auditoría en un módulo transversal
`core/src/modules/auditoria/`:

- El puerto `IAuditor` (método
  `registrar(evento: EventoAuditoria): Promise<void>`) es el único contrato para
  registrar eventos de auditoría de negocio en el backend.
- Se eliminó el puerto duplicado `IAuditoriaService` y el adaptador obsoleto
  `AuditoriaConsolaService`.
- Todos los casos de uso que mutan datos o producen eventos auditables en
  cualquier módulo (administración, inventario, etc.) inyectan `IAuditor`
  mediante inversión de dependencias (DIP).

### 2. Catálogo Estandarizado de Acciones y Entidades

Se centralizó el catálogo de valores permitidos en
`SHARED/contracts/src/administracion/auditoria.catalogo.ts` (y reflejado en
`core`):

- `ACCIONES_AUDITORIA`: `crear`, `editar`, `activar`, `inactivar`,
  `cambiar_rol`, `acceso_denegado`. En minúsculas y snake_case.
  - `restablecer_password` →
    `{ despues: { credenciales: 'restablecidas', sesionesRevocadas: true } }`
    (nunca la contraseña ni su hash)
- `ENTIDADES_AUDITORIA`: `sucursales`, `usuarios`, `categorias`, `proveedores`,
  `acceso`.
- El esquema Zod de consulta de auditoría valida estrictamente contra estos
  enums.

### 3. Convención de Cambios (`antes` / `despues`) y Sanitización

- Los eventos registran únicamente los atributos afectados bajo la estructura
  `{ antes: {...}, despues: {...} }`.
- La función pura `sanitizarDetalles` en
  `auditoria/domain/services/sanitizar-detalles.ts` redacta de forma recursiva
  con `'[REDACTADO]'` cualquier campo sensible coincidente con
  `/pass|clave|hash|token|secret|totp|otp/i`.
- Queda prohibido almacenar contraseñas, hashes, secretos TOTP, tokens o números
  de identificación confidenciales en `detalles`.

### 4. Tres Destinos Especializados de Auditoría

El sistema separa los registros según su propósito y ciclo de vida:

1. `logs_auditoria`: Eventos de negocio, mutaciones del sistema y accesos
   denegados autenticados.
2. `intentos_login`: Registro de intentos de autenticación exitosos y fallidos
   vía el puerto `IRegistroIntentosLogin` / `DrizzleIntentoLoginRepository`
   (RF-SA-F4, RF-SA-F5).
3. `logs_mcp_tools`: Invocaciones de tools ejecutadas por el servidor MCP
   (RF-SA-i9, pendiente para cuando se definan Tools).

### 5. Registro Best-Effort con Respaldo en Consola

El registro de auditoría (`DrizzleAuditoriaRepository` e
`DrizzleIntentoLoginRepository`) opera bajo la política _best-effort_: si la
inserción en base de datos falla por cualquier motivo técnico (desconexión,
timeout), se emite un `console.error` seguro con metadatos no sensibles
(`accion`, `entidad`, `usuarioId`), **sin abortar ni hacer fallar la operación
de negocio principal**.

### 6. Política de Auditoría en Peticiones GET

- **Regla general:** Las peticiones GET ordinarias **NO se auditan**. Los
  requerimientos RNF-06 y RNF-ADM-02 circunscriben la auditoría a operaciones de
  creación, modificación y eliminación. Auditar cada lectura saturaría
  rápidamente el almacenamiento y degradaría el rendimiento de la API.
- **Excepciones auditables en lectura:** Se auditan mediante eventos explícitos
  dentro de su caso de uso correspondiente:
  1. Lecturas de datos confidenciales (p. ej. liquidaciones de sueldos o
     reportes financieros consolidados).
  2. La consulta de la propia bitácora de auditoría (`consultar-auditoria`).
  3. Todo acceso denegado (HTTP 403), independientemente del método HTTP (`GET`,
     `POST`, `PUT`, etc.).
- **Semántica de Negocio vs. Verbo HTTP:** Se audita por la semántica del evento
  de negocio dentro del caso de uso y **no** por el verbo HTTP de la petición
  entrante. Operaciones como `POST /auth/logout` o `POST /auth/renovar-token`
  corresponden a gestión de sesión, no a mutaciones de negocio, por lo que no se
  registran en `logs_auditoria`.
- **Compatibilidad de métodos HTTP:** Si a futuro se habilita `PATCH`, deberá
  incluirse en `allowMethods` en `apps/api/src/main.ts`.

### 7. Integridad de la Tabla `logs_auditoria` (Solo Inserción)

Para cumplir con la inmutabilidad de la auditoría (RNF-ADM-02):

- Se implementaron triggers en MySQL (`trg_logs_auditoria_bloquea_update` y
  `trg_logs_auditoria_bloquea_delete`) que lanzan un `SIGNAL SQLSTATE '45000'`
  ante cualquier intento de modificación o borrado de registros en
  `logs_auditoria`.
- Recomendación de privilegios de usuario MySQL: otorgar únicamente `SELECT` e
  `INSERT` sobre `logs_auditoria` al usuario de conexión de la API
  (`warengine_api`).

---

## Pendiente y Fuera de Alcance (Backlog Futuro)

1. **Registro atómico con `unit-of-work.ts`:** Transacciones transaccionales
   atómicas conjuntas de negocio + auditoría (se abordará junto al módulo de
   facturación).
2. **Columna `sucursal_id` en `logs_auditoria`:** Particionamiento o aislamiento
   para que Administradores de Sucursal solo consulten registros de su sede
   (RNF-ADM-04).
3. **Auditoría de Tools del MCP (`logs_mcp_tools`):** Implementación del puerto
   y repositorio una vez que se definan las Tools activas del servidor MCP.
4. **Middleware global de auditoría, rate-limit y bloqueo de cuentas:** Quedan
   expresamente fuera de alcance del módulo de auditoría de negocio.
5. **Ajustes en la interfaz gráfica (`FRONT`):** Pendiente para el sprint de UI
   de administración.
