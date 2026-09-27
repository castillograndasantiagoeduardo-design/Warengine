# BACK/ — Backend completo de Warengine (workspace de Deno)

Contiene la API REST, el servidor MCP y todos los paquetes de lógica y adaptadores.

**Qué va aquí:** puntos de entrada (`apps/`), lógica de dominio y aplicación
(`packages/core`), adaptadores de infraestructura (`packages/database`,
`packages/platform`), piezas base (`packages/shared-kernel`) y el
Composition Root (`packages/composition`).

**Qué NO va aquí:** componentes de UI, lógica de renderizado, código que
dependa de React, ni archivos de estilos.

## Reglas de dependencia (resumen)

```
shared-kernel ← core ← database
                     ← platform
                           ↓
                       composition
                           ↓
                    apps/api   apps/mcp-server
```

Ver `docs/adr/0001-architecture-rules.md` para las reglas completas.
