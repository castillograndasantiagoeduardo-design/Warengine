# packages/composition/ — Composition Root único del backend

Es el único lugar del monorepo que conoce a `core`, `database` y `platform`
simultáneamente. Su única responsabilidad es instanciar y conectar todo.

**Qué va aquí:** la función `createContainer(env)` que crea repositorios,
servicios y casos de uso ya conectados entre sí, listos para ser usados por
`apps/api` y `apps/mcp-server`.

**Qué NO va aquí:** lógica de negocio, rutas HTTP, lógica de Tools MCP.
Si este archivo hace algo más que "new X(new Y(new Z()))", algo está mal.

**Documentación técnica:** Consulta [`Docs/infraestructura/composition.md`](../../../Docs/infraestructura/composition.md).
