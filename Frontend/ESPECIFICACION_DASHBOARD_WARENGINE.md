# ESPECIFICACIÓN MAESTRA: ESTÁNDAR DE DASHBOARDS WARENGINE (REFERENCIA: ADMIN DE SUCURSAL)

> **Documento de arquitectura visual y funcional para todos los Dashboards de WarEngine**  
> Esta especificación documenta la implementación definitiva del **Dashboard de Administrador de Sucursal (`/admin-sucursal`)** y establece el estándar obligatorio que deben seguir todos los paneles del sistema (Super Admin, Admin de Sucursal, Logística, B2B y POS).  
> **Reglas de integración**: Todo dashboard se conecta con el backend real mediante hooks y servicios tipados respetando Clean Architecture y RBAC. **NO se instalan librerías externas de gráficos**.

---

## 1. STACK Y DEPENDENCIAS

- **Framework**: Next.js (App Router, compilación con `--webpack`) + React + TypeScript.
- **Estilos**: Tailwind CSS v4 (`@import "tailwindcss";` y bloque `@theme inline` en `globals.css`).
- **Iconos**: `lucide-react` (única librería de íconos).
- **Gráficos**: SVG nativo reactivo con `ResizeObserver` (cero librerías externas de gráficos).
- **Fuentes (`next/font/google`)**: **Plus Jakarta Sans**, **Inter** e **IBM Plex Mono** con pesos `["400", "500", "600"]`.

---

## 2. CONFIGURACIÓN DE FUENTES E HIDRATACIÓN SIN PARPADEO (`layout.tsx`)

En el `layout.tsx` raíz se configuran las 3 fuentes principales del sistema de diseño y el script inline en `<head>` que aplica el tema por defecto (**Zafiro: Negro `#070d1a`, Azul `#3b6cf2` y Blanco `#f1f5f9`**) y el efecto de fondo por defecto (**`malla` — Retícula + luz**), o la preferencia guardada en `localStorage` antes del primer pintado:

```tsx
const scriptInicializacionTema = `
(function() {
  try {
    var d = document.documentElement;
    var paleta = localStorage.getItem('warengine-paleta') || 'zafiro';
    var fondo = localStorage.getItem('warengine-fondo') || 'malla';
    var tema = localStorage.getItem('warengine-tema') || 'dark';
    d.setAttribute('data-paleta', paleta);
    d.setAttribute('data-fondo', fondo);
    if (paleta === 'personalizada') {
      var varsRaw = localStorage.getItem('warengine-paleta-custom-vars');
      if (varsRaw) {
        var varsObj = JSON.parse(varsRaw);
        for (var k in varsObj) {
          if (Object.prototype.hasOwnProperty.call(varsObj, k)) {
            d.style.setProperty(k, varsObj[k]);
          }
        }
      }
    }
    if (tema === 'light') {
      d.classList.add('light');
      d.classList.remove('dark');
    } else {
      d.classList.add('dark');
      d.classList.remove('light');
    }
  } catch (e) {}
})();
`;
```

El elemento `<html>` lleva `data-paleta="zafiro"`, `data-fondo="malla"`, la clase `dark` y `suppressHydrationWarning`.

---

## 3. TOKENS, TEMAS Y TRANSPARENCIA CRISTALINA (`globals.css`)

### 3.1. Vinculación con Tailwind (`@theme inline`)
```css
@import "tailwindcss";
@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --color-brand-50: var(--p-50);
  --color-brand-100: var(--p-100);
  --color-brand-200: var(--p-200);
  --color-brand-300: var(--p-300);
  --color-brand-400: var(--p-400);
  --color-brand-500: var(--p-500);
  --color-brand-600: var(--p-600);
  --color-brand-700: var(--p-700);
  --color-brand-800: var(--p-800);
  --color-brand-900: var(--p-900);
  --color-brand-950: var(--p-950);

  --color-luz-1: var(--p-luz-1);
  --color-luz-2: var(--p-luz-2);
  --color-luz-3: var(--p-luz-3);
  --color-btn-primario-texto: var(--p-btn-texto);

  --color-navy-900: #0f1b33;
  --color-navy-950: #070d1a;

  --color-success: #15803d;
  --color-warning: #b45309;
  --color-danger: #b91c1c;
  --color-info: #0369a1;

  --color-bg: var(--bg);
  --color-surface: var(--surface);
  --color-border: var(--border);
  --color-text: var(--text);
  --color-text-muted: var(--text-muted);

  --font-sans: var(--fuente-texto);
  --font-titulos: var(--fuente-titulos);
  --font-mono: var(--fuente-codigo);
}
```

### 3.2. Los 11 Temas Oficiales + Tema Personalizado
El tema inicial por defecto es **`zafiro`** (Negro marino `#070d1a`, Azul `#3b6cf2` y Blanco). Además se definen en `globals.css` los selectores `html[data-paleta="..."]` y sus muestras `[data-muestra="..."]` para:
1. **`zafiro`** (Por defecto): base `#070d1a`, claro `#eef2f9`, luz1 `#2551d6`, luz2 `#4f46e5`, luz3 `#06b6d4`, `500: #3b6cf2`, `600: #2551d6`, texto btn `#ffffff`.
2. **`acero`** (Acero Corporativo): base `#090d14`, claro `#f1f5f9`, luz1 `#2563eb`, luz2 `#475569`, luz3 `#0284c7`, `500: #3b82f6`, `600: #2563eb`.
3. **`grafito`** (Grafito y Titanio): base `#090b10`, claro `#f3f4f6`, luz1 `#475569`, luz2 `#334155`, luz3 `#1e3a8a`, `500: #64748b`, `600: #475569`.
4. **`indigo`** (Índigo Institucional): base `#080a18`, claro `#eef0f9`, luz1 `#4338ca`, luz2 `#3730a3`, luz3 `#1d4ed8`, `500: #6366f1`, `600: #4f46e5`.
5. **`petroleo`** (Azul Petróleo): base `#071016`, claro `#eef5f8`, luz1 `#0284c7`, luz2 `#0f766e`, luz3 `#1e3a8a`, `500: #0284c7`, `600: #0369a1`.
6. **`vino`** (Borgoña Directivo): base `#10080c`, claro `#f8f1f3`, luz1 `#be123c`, luz2 `#881337`, luz3 `#334155`, `500: #e11d48`, `600: #be123c`.
7. **`oro`** (Oro y Obsidiana): base `#0b0a08`, claro `#f7f5ef`, luz1 `#d97706`, luz2 `#b45309`, luz3 `#334155`, `500: #eab308`, `600: #ca8a04`, texto btn `#1c1917`.
8. **`violeta`**: base `#0b0816`, claro `#f3effb`, luz1 `#7c3aed`, luz2 `#c026d3`, luz3 `#3b82f6`, `500: #8b5cf6`, `600: #7c3aed`.
9. **`cian`**: base `#0a0f14`, claro `#ecf6f9`, luz1 `#06b6d4`, luz2 `#0ea5e9`, luz3 `#475569`, `500: #22d3ee`, `600: #06b6d4`, texto btn `#04202b`.
10. **`esmeralda`**: base `#06110f`, claro `#edf7f5`, luz1 `#10b981`, luz2 `#14b8a6`, luz3 `#0ea5e9`, `500: #14b8a6`, `600: #0d9488`, texto btn `#ffffff`.
11. **`cobre`**: base `#0c0a09`, claro `#faf3ee`, luz1 `#f97316`, luz2 `#ea580c`, luz3 `#78350f`, `500: #f97316`, `600: #ea580c`.
12. **`[data-muestra="personalizada"]`**: `--m-1: var(--p-500, #3b6cf2); --m-2: var(--p-luz-1, #4f46e5); --m-3: var(--p-luz-2, #06b6d4);`.

### 3.3. Variables de Superficie y Clases de Vidrio (`.dark` y `.light`)
```css
:root,
.dark {
  --bg: var(--p-base);
  --surface: rgba(255, 255, 255, 0.025);
  --border: rgba(255, 255, 255, 0.08);
  --border-top-brillo: rgba(255, 255, 255, 0.14);
  --border-hover: rgba(255, 255, 255, 0.16);
  --separador-tabla: rgba(255, 255, 255, 0.06);
  --hover-tabla: rgba(255, 255, 255, 0.04);
  --text: #f1f5f9;
  --text-muted: #a5b4cc;
  --vidrio-bg: rgba(255, 255, 255, 0.025);
  --vidrio-fuerte-bg: color-mix(in srgb, var(--p-base, #070d1a) 94%, transparent);
  --vidrio-fuerte-borde: rgba(255, 255, 255, 0.12);
  --vidrio-fuerte-sombra: 0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2);
  --vidrio-borde: rgba(255, 255, 255, 0.08);
  --vidrio-sombra: 0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --vidrio-fallback: rgba(17, 25, 45, 0.95);
  --superficie-ctrl-bg: rgba(255, 255, 255, 0.05);
  --superficie-ctrl-borde: rgba(255, 255, 255, 0.1);
}

.light {
  --bg: var(--p-base-claro);
  --surface: rgba(255, 255, 255, 0.58);
  --border: rgba(15, 23, 42, 0.09);
  --border-top-brillo: rgba(255, 255, 255, 0.95);
  --border-hover: rgba(15, 23, 42, 0.18);
  --separador-tabla: rgba(15, 23, 42, 0.07);
  --hover-tabla: rgba(15, 23, 42, 0.035);
  --text: #0f172a;
  --text-muted: #475569;
  --vidrio-bg: rgba(255, 255, 255, 0.58);
  --vidrio-fuerte-bg: color-mix(in srgb, #ffffff 92%, var(--p-base-claro, #f8fafc));
  --vidrio-fuerte-borde: rgba(15, 23, 42, 0.12);
  --vidrio-fuerte-sombra: 0 4px 20px -2px rgba(15, 23, 42, 0.08), 0 1px 3px rgba(15, 23, 42, 0.04);
  --vidrio-borde: rgba(255, 255, 255, 0.82);
  --vidrio-sombra: 0 8px 28px rgba(15, 23, 42, 0.07), 0 0 0 1px rgba(15, 23, 42, 0.06), inset 0 1px 0 rgba(255, 255, 255, 0.95);
  --vidrio-fallback: rgba(255, 255, 255, 0.95);
  --superficie-ctrl-bg: rgba(255, 255, 255, 0.65);
  --superficie-ctrl-borde: rgba(15, 23, 42, 0.12);
}
```

### 3.4. PROBLEMA HISTÓRICO CON LAS TARJETAS (`.vidrio`) Y SU SOLUCIÓN DEFINITIVA

> **Diagnóstico técnico importante (Turbopack vs Webpack):**
> - En el proyecto de referencia (`prueba-diseno-warengine` en `localhost:3005`), compilado con `@tailwindcss/turbopack` (LightningCSS), escribir `-webkit-backdrop-filter` inmediatamente después de `backdrop-filter` hacía que LightningCSS **descartara la propiedad estándar `backdrop-filter`** y emitiera únicamente `-webkit-backdrop-filter: blur(20px) saturate(160%)`, el cual Chrome moderno ignora cuando no está la propiedad estándar. Gracias a eso, las tarjetas en `localhost:3005` se veían 100% cristalinas, permitiendo ver con total nitidez las líneas de `1px` de la cuadrícula (`.trama-malla`) a través de ellas.
> - En cambio, en **WarEngine (`localhost:3000`)**, compilado con `next dev --webpack` (`@tailwindcss/postcss`), el compilador conservaba `backdrop-filter: blur(20px) saturate(160%)`. Esto causaba dos problemas visuales severos:
>   1. **`blur(20px)` borraba por completo la retícula `.trama-malla`** detrás de las tarjetas (una línea de `1px` al `4%` de opacidad difuminada 20px desaparece por completo), haciendo que las tarjetas parecieran tener un fondo sólido y opaco.
>   2. **`saturate(160%)` sobreenfatizaba la luz azul de fondo (`mancha-aurora-2`)** detrás de las primeras tarjetas KPI, tiñendo las tarjetas de un relleno azul eléctrico saturado.
> - Adicionalmente, todas las tarjetas del dashboard (`TarjetaKpi`, `GraficoVentas`, `TarjetaRequiereAtencion`, `TablaFacturas`, `MetodosPago`, `TarjetaActivos`) deben envolverse siempre en el componente base `<Tarjeta>` (`className="vidrio flex flex-col overflow-hidden"`), sin añadir clases `bg-*` ni pseudo-elementos con gradientes radiales encima.

**Definición obligatoria de `.vidrio` y `.vidrio-fuerte` en `globals.css`:**

```css
.vidrio {
  position: relative;
  background-color: var(--vidrio-bg);
  border: 1px solid var(--vidrio-borde);
  border-top-color: var(--border-top-brillo);
  border-radius: 1rem;
  box-shadow: var(--vidrio-sombra);
  transition: transform 200ms ease, border-color 300ms ease, box-shadow 300ms ease, background-color 300ms ease;
}

.vidrio::before {
  content: "";
  position: absolute;
  top: 0;
  left: 8%;
  right: 8%;
  height: 1px;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.2) 50%,
    transparent 100%
  );
  pointer-events: none;
}

.vidrio:hover {
  transform: translateY(-4px);
  border-color: var(--border-hover);
}

.vidrio-fuerte {
  position: relative;
  background-color: var(--vidrio-fuerte-bg);
  border: 1px solid var(--vidrio-fuerte-borde, var(--vidrio-borde));
  border-bottom: 1px solid var(--vidrio-fuerte-borde, var(--border));
  border-top-color: var(--border-top-brillo);
  border-radius: 1rem;
  box-shadow: var(--vidrio-fuerte-sombra, var(--vidrio-sombra));
  transition: border-color 300ms ease, background-color 300ms ease, width 250ms ease, box-shadow 300ms ease;
}
```

---

## 4. CAPA DE FONDO AMBIENTAL (`FondoAmbiental.tsx`)

El componente `FondoAmbiental` se monta fijo detrás de todo el contenido (`fixed inset-0 pointer-events-none -z-10 overflow-hidden`) dentro de `BranchLayout.tsx` (cuyo contenedor raíz lleva `min-h-screen bg-bg text-text font-sans relative isolate overflow-x-clip`):

```tsx
export function FondoAmbiental() {
  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden" aria-hidden="true">
      {/* (d) Arriba a la izquierda (--p-luz-1) */}
      <div className="mancha-luz mancha-aurora-1 absolute -top-16 -left-16 w-[480px] h-[480px] rounded-full bg-luz-1/22 dark:bg-luz-1/35 blur-[110px]" />
      {/* (a) Detrás de la fila de KPIs (--p-500, a la izquierda del centro) */}
      <div className="mancha-luz mancha-aurora-2 absolute top-[11%] left-[22%] w-[540px] h-[350px] rounded-full bg-brand-500/22 dark:bg-brand-500/34 blur-[110px]" />
      {/* (b) Detrás del gráfico de ventas (--p-luz-2, a la derecha) */}
      <div className="mancha-luz mancha-aurora-3 absolute top-[33%] right-[10%] w-[580px] h-[440px] rounded-full bg-luz-2/20 dark:bg-luz-2/32 blur-[110px]" />
      {/* (c) Detrás de métodos de pago / abajo a la derecha (--p-luz-3) */}
      <div className="mancha-luz absolute bottom-[6%] right-[4%] w-[500px] h-[440px] rounded-full bg-luz-3/16 dark:bg-luz-3/22 blur-[110px]" />
      {/* Capa para la variante de fondo "malla" */}
      <div className="capa-malla absolute inset-0 trama-malla" />
      {/* Textura de ruido muy tenue (< 0.04) */}
      <div className="absolute inset-0 textura-ruido" />
    </div>
  );
}
```

---

## 5. GENERADOR DE PALETA PERSONALIZADA (`src/lib/generadorPaleta.ts`)

Utilitario puro en TypeScript (sin librerías externas) que:
- Exporta `CATALOGO_COLORES_ACENTO` (**12 colores bien diferenciados**).
- Exporta `CATALOGO_COLORES_FONDO` (**12 tonos oscuros profundos**).
- Calcula mediante mezcla RGB (`mezclarHex`) toda la escala `--p-50` a `--p-950` a partir del color de acento elegido y determina automáticamente el contraste WCAG AA de `--p-btn-texto` (`#ffffff` vs `#0f172a`).
- Inyecta o limpia las variables `--p-*` en `document.documentElement.style`.

---

## 6. PANEL "APARIENCIA DEL DASHBOARD" (`SelectorPaleta.tsx`) Y SIDEBAR (`BranchSidebar.tsx`)

### 6.1. Popover Flotante de Apariencia (`SelectorPaleta.tsx`)
- El contenedor padre tiene `relative` y el menú desplegable se posiciona con `absolute right-0 top-full mt-2 w-80 z-50 vidrio-popover p-4`, de modo que **jamás empuja ni agranda la barra superior**.
- Ordenado en una sola vista:
  1. **MODO**: Control segmentado (`Oscuro` | `Claro`).
  2. **TEMAS**: Cuadrícula de **3 columnas** (`grid-cols-3 gap-1.5`) con los 11 temas.
  3. **EFECTO DE FONDO**: Control segmentado (`Orbes difusos` | `Aurora ambiental` | `Retícula + luz`, con `malla` como valor por defecto).
  4. **PERSONALIZAR COLORES (AVANZADO)**: Acordeón colapsable cerrado por defecto con 5 roles de color.

### 6.2. Sidebar Flotante Colapsable (`BranchSidebar.tsx`) y Enrutamiento App Router
- Usa `.vidrio-fuerte h-[calc(100vh-2rem)] rounded-2xl flex flex-col justify-between select-none overflow-hidden shrink-0`.
- **Navegación basada en rutas reales (`next/link` + `usePathname`)**:
  - Configuración declarativa centralizada en `src/features/admin-sucursal/config/branch-navigation.config.ts` (`BRANCH_NAV_ITEMS` e `INVENTORY_SECTION_TABS`).
  - Layout compartido en `src/app/(panel)/admin-sucursal/layout.tsx` que monta `BranchLayout` una sola vez para todas las subrutas.
  - Subrutas del módulo:
    - `/admin-sucursal` → Dashboard (`BranchOverviewView`)
    - `/admin-sucursal/facturacion` → Facturación y Alertas (`BranchInvoicingView`)
    - `/admin-sucursal/inventario` → Pestaña Productos (`BranchInventoryView`, envuelta por `inventario/layout.tsx` con `SectionTabs`)
    - `/admin-sucursal/inventario/movimientos` → Pestaña Movimientos / Kardex (`BranchMovementsView`)
    - `/admin-sucursal/inventario/proveedores` → Pestaña Proveedores (`BranchSuppliersView`)
    - `/admin-sucursal/personal` → Personal y Turnos de Sede (`BranchStaffView`)
    - `/admin-sucursal/clientes`, `/admin-sucursal/activos`, `/admin-sucursal/reportes`, `/admin-sucursal/configuracion` → Vistas con estado estándar `ModuleUnderConstruction`.
- **Modo Expandido (`w-64`)**:
  - **Encabezado (`h-16 px-4 flex items-center justify-between border-b border-border`)**: A la izquierda el logo `"W"` (`w-8 h-8 rounded-lg bg-brand-600`) junto a `"WarEngine"` y `"Admin. de sucursal"`. Al extremo derecho (`ml-auto`), el botón con ícono `PanelLeftClose` para colapsar la barra lateral sin sobreponerse nunca al texto.
  - **Navegación**: Secciones `MENÚ` (`Dashboard`, `Facturación`, `Inventario`, `Clientes`), `OPERACIONES` (`Personal`, `Activos`, `Reportes`) y `SISTEMA` (`Configuración`).
  - **Pie (`p-3 border-t border-border`)**: Botón discreto de `Cerrar sesión` (`LogOut`).
- **Modo Colapsado / Dock (`w-20`)**:
  - **Encabezado (`h-16 px-4 flex items-center justify-center border-b border-border`)**: Muestra únicamente el logo `"W"` centrado.
  - **Navegación**: Íconos centrados en botones `w-11 h-11 rounded-xl` separados por divisores horizontales `w-6 h-px bg-border`.
  - **Pie (`p-3 border-t border-border space-y-1`)**: Incluye **arriba del botón de Cerrar sesión (`LogOut`)** el botón de expandir con ícono `PanelLeftOpen` para devolver el sidebar al tamaño completo.

---

## 7. ARQUITECTURA DE LA VISTA DE RESUMEN (`BranchOverviewView.tsx`)

### 7.1. Encabezado de Página
- **Izquierda**: Título `"Resumen de la sucursal"` (`text-2xl sm:text-3xl font-titulos font-semibold tracking-[-0.005em] text-text`) y fecha operativa debajo.
- **Derecha**: Botón secundario `Exportar` (ícono `Download`) y botón primario `Ver inventario` (ícono `Package`).

### 7.2. FILA 1: 4 Tarjetas KPI (`TarjetaKpi.tsx`)
Todas envuelven al componente base `<Tarjeta className="h-full">` en una cuadrícula `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch`:
1. **Ventas del día**: Monto formateado en COP | Badge `success` con variación porcentual | `vs. ayer` | Ícono `DollarSign`.
2. **Facturas emitidas**: Total de transacciones | Badge `success` | `vs. ayer` | Ícono `Receipt`.
3. **Stock bajo**: Total de alertas | Badge `danger` (`N críticos`) | `quiebre inminente` | Ícono `AlertTriangle`.
4. **En mantenimiento**: Equipos en taller | Badge `warning` (`1 en reparación`) | `de N equipos` | Ícono `Wrench`.

### 7.3. FILA 2: "Rendimiento de ventas" (2/3) + "Requiere atención" (1/3)
Cuadrícula `grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch`:
- **`GraficoVentas.tsx` (`lg:col-span-2`)**: Envuelto en `<Tarjeta>`, con conmutador `Barras` | `Curva analítica`, SVG reactivo medido con `ResizeObserver` y pie de 4 métricas (`Total semana`, `Día pico`, `Promedio diario`, `Vs. sem. anterior`).
- **`TarjetaRequiereAtencion.tsx` (`lg:col-span-1`)**: Envuelto en `<Tarjeta>`, con badge de asuntos prioritarios y 3 bloques compactos (`Stock crítico`, `Anuladas hoy`, `Turnos de caja`).

### 7.4. FILA 3: "Últimas facturas" (2/3) + "Métodos de pago" (1/3)
Cuadrícula `grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch`:
- **`TablaFacturas.tsx` (`lg:col-span-2`)**: Envuelto en `<Tarjeta sinRelleno>`, con filtros (`Todas` | `Emitidas` | `Anuladas` | `B2B`), 4 columnas sin scroll horizontal (`CONSECUTIVO`, `CLIENTE`, `TOTAL`, `ESTADO`) y máximo 5 filas visibles de `h-[52px]`.
- **`MetodosPago.tsx` (`lg:col-span-1`)**: Envuelto en `<Tarjeta>`, con gráfico Donut SVG centrado (`w-32 h-32`) y desglose de métodos con montos y porcentajes en `tabular-nums`.

### 7.5. FILA 4: Tarjeta Compacta "Activos" (`TarjetaActivos.tsx` — Ancho Completo)
- Envuelto en `<Tarjeta>`, con barra segmentada horizontal fina (`h-2 rounded-full`) y cuadrícula de 4 contadores (`Disponible`, `Asignado`, `Mantenimiento`, `Baja`).
