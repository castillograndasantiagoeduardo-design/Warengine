# packages/core/ — Dominio y Aplicación (Clean Architecture pura)

El corazón de Warengine. Aquí viven todas las reglas de negocio reales.

**Qué va aquí:** entidades de dominio (`Factura`, `Producto`, `Activo`…),
value objects, casos de uso (`emitir-factura.use-case.ts`), ports
(interfaces de repositorios y servicios externos), y políticas de autorización.

**Qué NO va aquí:** imports de Drizzle, código HTTP, JWT, bcrypt, ni nada
que dependa de cómo se almacenan o transmiten los datos. Los ports definen
contratos; las implementaciones van en `database/` y `platform/`.

**Documentación técnica:** Consulta el índice de módulos en [`Docs/modulos/README.md`](../../../Docs/modulos/README.md).
