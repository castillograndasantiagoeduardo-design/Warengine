# FRONT/ — Interfaz web de Warengine (Next.js App Router)

Aplicación web construida con Next.js 15, TypeScript y Tailwind CSS.

**Qué va aquí:** rutas y layouts (`app/`), funcionalidades por módulo de
negocio (`features/`), componentes visuales reutilizables (`components/ui/`)
y utilidades frontend (`lib/`). Importa esquemas de validación desde
`@warengine/contracts` (alias configurado en `tsconfig.json`).

**Qué NO va aquí:** lógica de negocio, acceso directo a la base de datos,
imports de `Backend/` ni entidades de dominio. FRONT solo habla con Backend a
través de HTTP usando los DTOs de `@warengine/contracts`.

---

> 📖 **Documentación técnica oficial:** [`Docs/infraestructura/frontend.md`](../Docs/infraestructura/frontend.md)
