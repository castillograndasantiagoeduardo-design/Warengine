# Infraestructura: Frontend Web (`Frontend`)

> **Aplicación:** `Frontend`  
> **Framework:** Next.js 16.3.6 (App Router), React 19, Tailwind CSS v4, TypeScript 5.  
> **Contratos:** `@warengine/contracts` (vía transpilePackages y path alias a `../Shared/contracts/src/index.ts`).  
> **Estado en el repositorio:** **ESQUELETO INICIAL / SCAFFOLD**.

---

## 1. Estado Real del Código

A diferencia del Backend (que cuenta con un núcleo de dominio, base de datos y API REST funcionales), el paquete `Frontend` se encuentra actualmente en estado de **estructura base (scaffold)** generada por el iniciador de Next.js, con la arquitectura de carpetas preparada para el desarrollo de módulos.

- **Compilación verificada:** `npm run build` compila limpiamente (0 errores).
- **Páginas de negocio implementadas:** `0` (la ruta raíz `/` renderiza la plantilla de bienvenida por defecto de Next.js en [`Frontend/src/app/page.tsx`](../../Frontend/src/app/page.tsx)).
- **Componentes de interfaz implementados:** `0` (carpetas con archivos `.gitkeep`).

---

## 2. Reglas Arquitectónicas de la Capa Frontend

1. **Aislamiento Total del Backend:**
   - **PROHIBIDO** importar cualquier archivo de `Backend/` (ni `@warengine/core`, ni `@warengine/database`, ni `@warengine/platform`, ni `@warengine/composition`).
   - El Frontend se comunica con el Backend **únicamente a través de peticiones HTTP** (fetch a `http://localhost:8017`).
2. **Uso de Contratos Compartidos:**
   - Los únicos tipos y esquemas compartidos provienen de `@warengine/contracts` (`Shared/contracts`).
   - Los formularios de UI validarán sus entradas con los mismos esquemas Zod que la API REST usa para validar los payloads.
3. **Manejo de Sesión sin Almacenamiento Local:**
   - Las cookies de sesión (`access_token`, `refresh_token`) son de tipo `HttpOnly`, configuradas por el Backend.
   - JavaScript en el navegador no puede leer ni manipular los tokens directamente, previniendo ataques XSS.
   - Toda petición HTTP a la API REST debe incluir `credentials: 'include'` para transmitir las cookies automáticamente.

---

## 3. Estructura de Directorios y Organización Planificada

El árbol de directorios de `Frontend/src` sigue el patrón de **Feature-Sliced Design / Vertical Slices**:

```
Frontend/src/
├── app/                                # App Router de Next.js
│   ├── (autenticacion)/                # Grupo de rutas de acceso (login, recuperación) [.gitkeep]
│   ├── (panel)/                        # Grupo de rutas de backoffice y administración [.gitkeep]
│   ├── (punto-de-venta)/               # Grupo de rutas POS y cobro rápido [.gitkeep]
│   ├── favicon.ico
│   ├── globals.css                     # Estilos globales y Tailwind CSS
│   ├── layout.tsx                      # Layout raíz HTML
│   └── page.tsx                        # Página principal (plantilla Next.js)
├── components/
│   └── ui/                             # Componentes base reutilizables (botones, inputs, tablas) [.gitkeep]
├── features/                           # Módulos verticales por contexto de negocio
│   ├── administracion/                 # (api, components, hooks) [.gitkeep]
│   ├── asistente/                      # (api, components, hooks) [.gitkeep]
│   ├── autenticacion/                  # (api, components, hooks) [.gitkeep]
│   ├── facturacion/                    # (api, components, hooks) [.gitkeep]
│   ├── inventario/                     # (api, components, hooks) [.gitkeep]
│   └── logistica/                      # (api, components, hooks) [.gitkeep]
├── lib/                                # Clientes HTTP y utilidades compartidas [.gitkeep]
└── middleware.ts                       # Middleware de protección de rutas (stub)
```

---

## 4. Middleware de Protección: `middleware.ts`

- **Archivo:** [`Frontend/src/middleware.ts`](../../Frontend/src/middleware.ts)
- **Estado actual:** Stub que ejecuta `return NextResponse.next();` con el comentario `// TODO: implementar cuando se desarrolle el módulo de autenticación.`
- **Configuración de rutas:**
  ```ts
  export const config = {
    matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
  };
  ```
- **Responsabilidad planificada:**
  1. Inspeccionar la presencia de la cookie de sesión (`access_token`).
  2. Redirigir a `/iniciar-sesion` si una ruta protegida (panel o POS) es accedida sin sesión.
  3. Redirigir a `/no-autorizado` si el rol no tiene acceso a la vista correspondiente.
  4. **Prohibido:** Consultas a base de datos o llamadas pesadas al backend dentro del middleware de Next.js.

---

## 5. Integración con Contratos (`next.config.ts`)

- **Archivo:** [`Frontend/next.config.ts`](../../Frontend/next.config.ts)
- Configuración para resolver el paquete `@warengine/contracts` directamente desde su código fuente en TypeScript:
  ```ts
  import type { NextConfig } from "next";
  import path from "path";

  const nextConfig: NextConfig = {
    transpilePackages: ["@warengine/contracts"],
    webpack: (config) => {
      config.resolve.alias["@warengine/contracts"] = path.resolve(
        __dirname,
        "../Shared/contracts/src/index.ts"
      );
      return config;
    },
  };

  export default nextConfig;
  ```
- **Configuración en `tsconfig.json`:**
  ```json
  "paths": {
    "@/*": ["./src/*"],
    "@warengine/contracts": ["../Shared/contracts/src/index.ts"]
  }
  ```
