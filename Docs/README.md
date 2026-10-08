# Documentación Oficial de Warengine (`Docs/`)

Este directorio contiene la documentación técnica, funcional y de arquitectura de Warengine. Cada documento refleja con fidelidad total el estado del código en el working tree actual del repositorio.

---

## Estructura de la Documentación

- **[Módulos de Negocio (`Docs/modulos/`)](./modulos/README.md):**
  Documentación técnica completa de cada módulo funcional y transversal de Warengine. Cada documento detalla casos de uso, endpoints HTTP (rutas, métodos, permisos y códigos de respuesta), contratos Zod, tablas de base de datos, tests y brechas respecto al SRS:
  - [Autenticación & RBAC](./modulos/autenticacion.md) (`IMPLEMENTADO`)
  - [Administración de Personal & Sucursales](./modulos/administracion.md) (`PARCIAL`)
  - [Auditoría del Sistema](./modulos/auditoria.md) (`IMPLEMENTADO` — Transversal)
  - [Inventario](./modulos/inventario.md) (`PARCIAL` — Categorías y Proveedores)
  - [Facturación & POS](./modulos/facturacion.md) (`PARCIAL` — Clientes)
  - [Logística de Activos](./modulos/logistica.md) (`SOLO ESQUEMA`)
  - [Asistente IA (MCP)](./modulos/mcp.md) (`ESQUELETO`)

- **[Infraestructura Técnica (`Docs/infraestructura/`)](./infraestructura/README.md):**
  Documentación de los estratos técnicos, persistencia, contratos compartidos y puntos de entrada:
  - [Shared Kernel (`@warengine/shared-kernel`)](./infraestructura/shared-kernel.md)
  - [Persistencia y Base de Datos (`@warengine/database`)](./infraestructura/base-de-datos.md)
  - [Plataforma Técnica (`@warengine/platform`)](./infraestructura/platform.md)
  - [Composición y Dependency Injection (`@warengine/composition`)](./infraestructura/composition.md)
  - [API REST HTTP (`apps/api`)](./infraestructura/api.md)
  - [Contratos Compartidos (`@warengine/contracts`)](./infraestructura/contratos.md)
  - [Frontend Web (`Frontend/`)](./infraestructura/frontend.md)

- **Contexto Arquitectónico (`Docs/context/`):**
  - [`proyecto-warengine.md`](./context/proyecto-warengine.md): Guía de referencia obligatoria para desarrolladores y asistentes IA, con reglas de arquitectura limpia, pautas de DDD y matriz de dependencias.

- **Base de Datos (`Docs/database/`):**
  - [`WARENGINE_FULL_BD.sql`](./database/WARENGINE_FULL_BD.sql): Script DDL canónico de la base de datos MySQL 8 (25 triggers y 18 CHECKs activos).

- **Decisiones de Arquitectura (`Docs/adr/`):**
  - `ADR 0001`: Inversión de dependencias y composición limpia.
  - `ADR 0002`: Registro transversal de auditoría desacoplado por evento de caso de uso.

- **Requerimientos de Software (`Docs/srs/`):**
  - Especificación formal de requerimientos funcionales y no funcionales del sistema.
