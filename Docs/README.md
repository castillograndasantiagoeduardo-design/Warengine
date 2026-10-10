# Docs/ — Documentación Oficial del Proyecto Warengine

Este directorio centraliza toda la documentación técnica, funcional y de arquitectura de Warengine.

---

## Estructura General

```
Docs/
├── README.md                           # Este índice general
├── adr/                                # Decisiones de Arquitectura (ADR)
│   ├── 0001-architecture-rules.md     # Reglas fundamentales de arquitectura limpia
│   └── 0002-auditoria.md              # Estrategia de auditoría no bloqueante y destino
├── context/                            # Contexto para asistentes de desarrollo e IA
│   ├── README.md
│   └── proyecto-warengine.md          # Especificación integral del sistema
├── database/                           # Esquemas y scripts SQL
│   ├── WARENGINE_FULL_BD.sql          # Script DDL completo de MySQL 8
│   └── cambios/                       # Scripts incrementales versionados
├── modulos/                            # Documentación técnica por módulo de negocio
│   ├── README.md                      # Índice general y matriz de estado de módulos
│   ├── autenticacion.md               # Login, JWT, bloqueo, refresco, cookies
│   ├── administracion.md              # Sucursales, usuarios, roles, permisos
│   ├── auditoria.md                   # Auditoría transversal, sanitización, triggers
│   ├── inventario.md                  # Categorías, proveedores, productos, SKU
│   ├── facturacion.md                 # Clientes B2B/B2C, turnos de caja, ventas
│   ├── logistica.md                   # Activos, mantenimientos, triggers SQL
│   └── mcp.md                         # Protocolo MCP, tools, server
├── infraestructura/                    # Documentación técnica de capas y fontanería
│   ├── README.md                      # Índice general, diagrama y matriz de .env
│   ├── shared-kernel.md               # Result<T,E>, DomainError, paginación
│   ├── base-de-datos.md               # Conexión MySQL, Drizzle ORM, repositorios
│   ├── platform.md                    # Argon2, JWT HS256, validación de variables
│   ├── composition.md                 # Composition Root, Pure DI (createContainer)
│   ├── api.md                         # API REST Hono, middlewares, HTTP status
│   ├── contratos.md                   # Esquemas Zod, roles, permisos granulares
│   └── frontend.md                    # Arquitectura Next.js 16 (App Router)
└── srs/                               # Requisitos de software oficiales
```

---

## Enlaces Rápidos

- [Índice de Módulos de Negocio](./modulos/README.md)
- [Índice de Infraestructura y Variables de Entorno](./infraestructura/README.md)
- [Contexto Integral del Proyecto](./context/proyecto-warengine.md)
- [ADR 0001: Reglas de Arquitectura](./adr/0001-architecture-rules.md)
- [ADR 0002: Sistema de Auditoría](./adr/0002-auditoria.md)
