# Warengine

Plataforma de gestión de inventario, facturación/POS, personal, activos internos y asistente conversacional con IA.

## Arquitectura

Monorepo con tres zonas independientes:

| Zona | Tecnología | Propósito |
|------|-----------|-----------|
| `BACK/` | Deno + TypeScript + Drizzle ORM + MySQL 8 | API REST + Servidor MCP |
| `FRONT/` | Next.js (App Router) + TypeScript + Tailwind | Interfaz web |
| `SHARED/` | TypeScript + Zod | Contratos compartidos (DTOs, esquemas de validación) |

## Cómo arrancar en desarrollo

### 1. Base de datos
```bash
# Copia las variables de entorno
cp .env.example .env
# Edita .env con tus valores reales
# Levanta MySQL con Docker
docker-compose up -d
```

### 2. Backend
```bash
cd BACK
deno task dev-api       # Inicia la API REST
deno task dev-mcp       # Inicia el servidor MCP (en otra terminal)
```

### 3. Frontend
```bash
cd FRONT
npm install
npm run dev
```

## Reglas de dependencia (resumen)

```
shared-kernel ← core ← database
                     ← platform
                           ↓
                       composition
                           ↓
                    apps/api  apps/mcp-server
```

Ver `docs/adr/0001-architecture-rules.md` y `docs/context/proyecto-warengine.md` para las reglas completas.

## Documentación

- `docs/srs/` — Documento de Requisitos del Sistema (SRS)
- `docs/database/` — Script SQL completo de la base de datos
- `docs/adr/` — Decisiones de arquitectura (Architecture Decision Records)
- `docs/context/proyecto-warengine.md` — Contexto vivo para desarrolladores y asistente IA
