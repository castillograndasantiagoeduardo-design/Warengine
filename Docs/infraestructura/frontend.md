# Frontend Web (`Frontend/`)

Este documento describe la arquitectura, estado de desarrollo y directrices técnicas de la aplicación web de Warengine en `Frontend/`.

---

## 1. Estado Actual del Frontend

La aplicación web se encuentra actualmente en estado de **andamiaje inicial (Boilerplate / Shell)**.

### Stack Tecnológico
- **Framework:** Next.js `16.3.6` (App Router).
- **Librería UI:** React `19.2.8`.
- **Estilos:** Tailwind CSS `^4.0.0` con `@tailwindcss/postcss`.
- **Lenguaje:** TypeScript `^5.0.0`.
- **Scripts:** `npm run dev`, `npm run build`, `npm run start`.

---

## 2. Estructura de Directorios: Realidad del Working Tree

A diferencia de la especificación conceptual, el código en el working tree actual contiene únicamente la estructura de carpetas con marcadores `.gitkeep`:

```
Frontend/src/
├── app/
│   ├── (autenticacion)/      (.gitkeep — Rutas de login/recuperación pendientes)
│   ├── (panel)/              (.gitkeep — Dashboard administrativo pendiente)
│   ├── (punto-de-venta)/     (.gitkeep — Terminal POS pendiente)
│   ├── globals.css           (Configuración base Tailwind)
│   ├── layout.tsx            (Root layout con fuentes Geist)
│   └── page.tsx              (Página de bienvenida predeterminada de Next.js)
├── components/
│   └── ui/                   (.gitkeep — Componentes atómicos pendientes)
├── features/
│   ├── administracion/       (api/, components/, hooks/ con .gitkeep)
│   ├── asistente/            (api/, components/, hooks/ con .gitkeep)
│   ├── autenticacion/        (api/, components/, hooks/ con .gitkeep)
│   ├── facturacion/          (api/, components/, hooks/ con .gitkeep)
│   ├── inventario/           (api/, components/, hooks/ con .gitkeep)
│   └── logistica/            (api/, components/, hooks/ con .gitkeep)
├── lib/                      (.gitkeep — Utilidades cliente pendientes)
└── middleware.ts             (Stub sin lógica activa)
```

---

## 3. Middleware de Enrutamiento (`middleware.ts`)

Ubicación: [`Frontend/src/middleware.ts`](../../Frontend/src/middleware.ts)

Actualmente implementa un **stub** sin validación activa:

```typescript
export function middleware(_request: NextRequest) {
  // TODO: implementar cuando se desarrolle el módulo de autenticación.
  return NextResponse.next();
}
```

### Comportamiento Requerido Futuro
1. Inspeccionar la cookie HttpOnly `access_token`.
2. Decodificar el payload del token para evaluar el `rolId` o redirigir a `/iniciar-sesion` si la sesión no existe.
3. Contrastar la ruta solicitada con la matriz de roles y permisos del usuario, redirigiendo a `/no-autorizado` si carece de privilegios.

---

## 4. Reglas de Integración con el Backend

1. **Consumo de Contratos Compartidos:**
   - La aplicación debe validar formularios y tipar llamadas HTTP utilizando exclusivamente `@warengine/contracts`, mapeado en `tsconfig.json`.
   - Queda estrictamente prohibido duplicar esquemas Zod o tipos de datos dentro del código frontend.
2. **Comunicación HTTP:**
   - Se comunica únicamente con la API REST de Warengine (`http://localhost:8017`).
   - Las peticiones que requieran autenticación deben enviar `credentials: 'include'` en `fetch` para intercambiar cookies HttpOnly (`access_token` y `refresh_token`).
3. **Cero Lógica de Negocio en Cliente:**
   - Toda validación de invariantes (disponibilidad de stock, unicidad, estado de caja) se delega al backend; el frontend solo realiza validación de formato mediante Zod.
