# packages/shared-kernel/ — Piezas base sin dependencias externas

Fundamento de toda la arquitectura. Provee los bloques de construcción que
usan todos los demás paquetes del backend.

**Qué va aquí:** `Result<T,E>`, `DomainError`, `Entity`, `ValueObject`, `Money`,
`Clock`, `Pagination`, `ids`. Solo TypeScript puro, sin librerías externas.

**Qué NO va aquí:** lógica de Warengine, imports de zod, Drizzle, HTTP o
cualquier librería de terceros. Este paquete debe poder copiarse a cualquier
proyecto de TypeScript y funcionar sin cambios.

---

> 📖 **Documentación técnica oficial:** [`Docs/infraestructura/shared-kernel.md`](../../../Docs/infraestructura/shared-kernel.md)
