# ADR 0001 — Reglas de Dependencia de la Arquitectura Warengine

**Fecha:** 2026-09-25  
**Estado:** Aceptado  
**Contexto:** Warengine sigue Clean Architecture. Para que la arquitectura no se degrade con el tiempo, estas reglas de dependencia son obligatorias y deben ser verificadas en cada revisión de código.

---

## Reglas

### 1. `shared-kernel`
- **No depende de nada.**
- Contiene piezas base puras de TypeScript: `Result<T,E>`, `DomainError`, `Entity`, `ValueObject`, `Money`, `Clock`, `Pagination`, `ids`.

### 2. `Shared/contracts`
- **Solo depende de `zod`.**
- Define la **forma** de los datos (DTOs, esquemas de validación Zod).
- Las **reglas de negocio** ("el stock no puede quedar negativo") viven en `core/…/domain`, no aquí.

### 3. `core`
- **Depende solo de:** `shared-kernel` y `Shared/contracts`.
- **PROHIBIDO importar:** Drizzle, librerías HTTP, JWT, bcrypt o cualquier detalle de infraestructura.
- Define `ports` (interfaces/contratos); **nunca los implementa**.

### 4. `database` y `platform`
- **Implementan los ports de `core`.**
- Dependen de `core`, pero `core` **NO depende de ellas** (Dependency Inversion Principle).
- `database` → Drizzle ORM, MySQL, migraciones, repositorios, mappers.
- `platform` → JWT, hashing, TOTP, mailer, logger, rate-limit, config.

### 5. `composition`
- Es el **único lugar del monorepo** que conoce a `core`, `database` y `platform` al mismo tiempo.
- Su única responsabilidad es crear instancias (`createContainer(env)`) y conectar implementaciones a ports.
- **No contiene lógica de negocio.**

### 6. `apps/api` y `apps/mcp-server`
- **Solo obtienen casos de uso desde `composition`.**
- **PROHIBIDO:** importar repositorios, Drizzle, SQL, o lógica de dominio directamente.
- Cada Tool del MCP **no contiene** lógica de autorización ni de negocio: delega siempre al `gateway` y al caso de uso.

### 7. `Frontend`
- **Solo depende de `Shared/contracts`.**
- **NUNCA importa nada de `Backend`** (ni paquetes, ni tipos de dominio, ni entidades).

---

## Diagrama

```
shared-kernel
     ↑
  contracts (SHARED)
     ↑
   core  ←────────────────────────────────────┐
     ↑                                         │
 database    platform                          │
     ↑           ↑                             │
     └─────┬─────┘                             │
        composition                            │
           ↑                                   │
    apps/api   apps/mcp-server                 │
                                               │
FRONT ──→ contracts (SHARED) ──────────────────┘
```

---

## Consecuencias

- Un `import` de Drizzle dentro de `core/` es una violación grave y debe revertirse inmediatamente.
- Un controller o Tool que calcule impuestos, descuentos o valide stock está rompiendo la arquitectura.
- Cualquier nueva dependencia entre paquetes debe evaluarse contra estas reglas antes de aceptarse.
