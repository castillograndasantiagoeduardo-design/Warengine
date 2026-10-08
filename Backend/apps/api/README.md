# apps/api/ — API REST de Warengine

Punto de entrada HTTP del sistema. Traduce peticiones web a llamadas a casos de uso.

**Qué va aquí:** servidor HTTP (Hono u Oak), rutas, controllers (validan con
contracts → llaman al caso de uso → devuelven respuesta), middlewares de
autenticación/autorización/rate-limit y presenters que convierten `Result`
en códigos HTTP.

**Qué NO va aquí:** lógica de negocio, consultas directas a la base de datos,
importaciones de Drizzle, ni entidades de dominio. Los controllers solo
orquestan, no calculan.

**Documentación técnica:** Consulta [`Docs/infraestructura/api.md`](../../../Docs/infraestructura/api.md). Los endpoints y rutas de negocio específicas se documentan en [`Docs/modulos/`](../../../Docs/modulos/).
