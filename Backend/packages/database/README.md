# packages/database/ — Infraestructura de persistencia (Drizzle + MySQL)

Implementa todos los ports de `core` relacionados con la base de datos.

**Qué va aquí:** cliente Drizzle, configuración de migraciones, definición de
tablas (`schema/`), repositorios concretos organizados por módulo de negocio,
mappers que convierten filas de BD a entidades de dominio, y el unit-of-work
para operaciones atómicas multi-tabla.

**Qué NO va aquí:** lógica de negocio, reglas de dominio, casos de uso. Si
un repositorio hace más que persistir o recuperar datos, está mal ubicado.

**Documentación técnica:** Consulta [`Docs/infraestructura/base-de-datos.md`](../../../Docs/infraestructura/base-de-datos.md).
