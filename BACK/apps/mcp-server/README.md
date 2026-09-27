# apps/mcp-server/ — Servidor MCP de Warengine (puerta de entrada para el asistente IA)

Segunda entrada al sistema. Expone Tools seguras para que un LLM consulte y
opere sobre Warengine, reutilizando los mismos casos de uso que la API REST.

**Qué va aquí:** sesión JWT adaptada al MCP, gateway de autorización de Tools,
catálogo de Tools con filtro por rol, implementaciones de cada Tool (una por
archivo), y presenters que convierten resultados en texto legible para el LLM.

**Qué NO va aquí:** lógica de negocio, validación de permisos dentro de la
propia Tool (eso es responsabilidad del gateway), consultas directas a la BD.
