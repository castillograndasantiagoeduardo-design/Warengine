# apps/api/ — API REST de Warengine

Punto de entrada HTTP del sistema. Traduce peticiones web a llamadas a casos de uso.

**Qué va aquí:** servidor HTTP (Hono u Oak), rutas, controllers (validan con
contracts → llaman al caso de uso → devuelven respuesta), middlewares de
autenticación/autorización/rate-limit y presenters que convierten `Result`
en códigos HTTP.

**Qué NO va aquí:** lógica de negocio, consultas directas a la base de datos,
importaciones de Drizzle, ni entidades de dominio. Los controllers solo
orquestan, no calculan.

---

## Documentación Interactiva (Swagger UI)

Una vez iniciado el servidor (`deno task dev-api`), puedes acceder a la documentación interactiva:
- **Swagger UI:** `http://localhost:8017/swagger` (o `http://localhost:8017/docs`)
- **Especificación OpenAPI (JSON):** `http://localhost:8017/openapi.json`

---

> 📖 **Documentación técnica oficial:** [`Docs/infraestructura/api.md`](../../../Docs/infraestructura/api.md)
