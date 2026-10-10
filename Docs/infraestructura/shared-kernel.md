# Infraestructura — Shared Kernel (`@warengine/shared-kernel`)

> **Propósito y estado:** **IMPLEMENTADO** (Cimientos funcionales puros de TypeScript sin dependencias)  
> **Ubicación:** `Backend/packages/shared-kernel/`  
> **Arquitectura:** ADR 0001 (Regla 1)

---

## 1. Propósito

El paquete `@warengine/shared-kernel` provee los tipos primitivos y patrones funcionales transversales que constituyen la base de Clean Architecture en Warengine. Permite manejar el flujo de control de operaciones de negocio mediante retornos explícitos de éxito/falla sin recurrir al lanzamiento descontrolado de excepciones en tiempo de ejecución.

---

## 2. Mapa de Archivos

```
Backend/packages/shared-kernel/
├── README.md
├── deno.json
├── mod.ts                         # Punto de entrada (re-exporta Result, DomainError, ResultadoPaginado)
└── src/
    ├── DomainError.ts             # Clase base abstracta de errores de negocio
    ├── Pagination.ts              # Interfaz genérica para colecciones paginadas
    ├── Result.ts                  # Tipo y clase Result<T, E> para manejo funcional de errores
    └── .gitkeep
```

---

## 3. Componentes y Responsabilidades

### 3.1 `Result<T, E extends DomainError>` ([Result.ts](../../Backend/packages/shared-kernel/src/Result.ts))
Encapsula el resultado de una operación que puede fallar de forma controlada:
- **`Result.ok<T>(value?: T): Result<T, never>`**: Fábrica para operaciones exitosas.
- **`Result.fail<E>(error: E): Result<never, E>`**: Fábrica para fallas de negocio.
- **Getters:**
  - `isSuccess: boolean`
  - `isFailure: boolean`
  - `value: T` (lanza error si se intenta acceder sobre un fallo)
  - `error: E` (lanza error si se intenta acceder sobre un éxito)

### 3.2 `DomainError` ([DomainError.ts](../../Backend/packages/shared-kernel/src/DomainError.ts))
Clase abstracta de la que heredan todas las clases de error de los módulos de negocio (`AutenticacionErrors`, `AdministracionErrors`, `InventarioErrors`, `FacturacionErrors`):
- `public abstract readonly code: string`: Código canónico de error en mayúsculas y snake_case (ej. `'CREDENCIALES_INVALIDAS'`, `'SUCURSAL_DUPLICADA'`).
- `public readonly message: string`: Mensaje descriptivo para el cliente o el desarrollador.
- Extiende la clase nativa `Error` de JavaScript preservando el stack trace.

### 3.3 `ResultadoPaginado<T>` ([Pagination.ts](../../Backend/packages/shared-kernel/src/Pagination.ts))
Contrato genérico para retornos de listas paginadas:
```typescript
export interface ResultadoPaginado<T> {
  items: T[];
  total: number;
  limite: number;
  offset: number;
}
```

---

## 4. Reglas Arquitectónicas y Dependencias Reales

1. **Regla de oro (ADR 0001, Regla 1):** `shared-kernel` **no depende de nada**.
2. **Verificación de importaciones reales:**
   - La inspección del árbol demuestra que ningún archivo de `shared-kernel` importa paquetes de `node_modules`, Drizzle, Hono, Zod ni módulos de Deno stdlib.
   - Todo el paquete es TypeScript puro compilable en cualquier entorno (Node.js, Deno, navegadores).
3. **Quién lo consume:** Es consumido por `@warengine/core`, adaptadores de `@warengine/database` y presenters de `apps/api`.

---

## 5. Pendientes y Deuda Técnica

1. **Tipos de Dominio Pendientes:** El documento de contexto (`Docs/context/proyecto-warengine.md`, sección 1.1) menciona abstracciones base como `Entity`, `ValueObject`, `Money`, `Clock` e identificadores tipados `ids`. Actualmente las entidades de `core` se definen directamente como clases sin heredar de una clase base `Entity` de `shared-kernel`.
