# Regla de Sincronización Continua de Contexto (CLAUDE.md)

Siempre que se realice una modificación estructural en el proyecto Warengine, es **obligatorio actualizar `CLAUDE.md`** para mantenerlo siempre al día.

### Cuándo debes actualizar `CLAUDE.md`:
1. **Nuevos módulos o bounded contexts:** Si se crea una nueva carpeta en `Backend/packages/core/src/` o `Frontend/src/features/`.
2. **Nuevos endpoints o rutas:** Si se registran nuevas rutas en `apps/api/src/routes/`.
3. **Nuevas tablas o triggers en base de datos:** Si se agregan esquemas Drizzle en `database/src/schema/` o triggers en MySQL.
4. **Nuevos comandos o scripts:** Si se agrega una nueva tarea a `Backend/deno.json` o `Frontend/package.json`.
5. **Nuevas variables de entorno:** Si se requiere una nueva variable en `.env`.
6. **Nuevos componentes o páginas:** Si se añaden nuevas páginas en el panel o módulos de frontend.
7. **Nuevas herramientas MCP:** Si se exponen nuevas tools para agentes en `apps/mcp-server`.

Esta actualización debe realizarse dentro del mismo flujo de trabajo antes de dar la tarea por finalizada.
