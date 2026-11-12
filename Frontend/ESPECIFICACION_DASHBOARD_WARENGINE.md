# ESPECIFICACIÓN MAESTRA: REEMPLAZO DEL DASHBOARD DE ADMINISTRADOR DE SUCURSAL (WARENGINE)

> **Instrucción directa para Antigravity en el repositorio principal de WarEngine:**  
> Reemplaza el diseño y la estructura visual del **Dashboard del Administrador de Sucursal** actual por el diseño especificado en este documento.  
> **Reglas de integración**: Conserva las llamadas a la API, hooks de datos, rutas de navegación y permisos que ya existan en el proyecto real (si algún dato como turnos de caja o variación semanal aún no viene del backend, usa los datos de respaldo indicados aquí y déjalo marcado con un comentario `// TODO`). **NO toques el Backend ni instales librerías externas de gráficos**.

---

## 1. STACK Y DEPENDENCIAS

- **Framework**: Next.js (App Router) + React + TypeScript.
- **Estilos**: Tailwind CSS v4 (`@import "tailwindcss";` y bloque `@theme inline` en `globals.css`).
- **Iconos**: `lucide-react` (única librería de íconos).
- **Gráficos**: SVG nativo reactivo con `ResizeObserver` (cero librerías externas de gráficos).
- **Fuentes (`next/font/google`)**: Únicamente **Plus Jakarta Sans**, **Inter** e **IBM Plex Mono** con pesos `["400", "500", "600"]`.

---

## 2. CONFIGURACIÓN DE FUENTES E HIDRATACIÓN SIN PARPADEO (`layout.tsx`)

En el `layout.tsx` raíz (o layout del dashboard), configura las 3 fuentes fijas y el script inline en `<head>` que aplica el tema por defecto (**Zafiro: Negro `#070d1a`, Azul `#3b6cf2` y Blanco `#f1f5f9`**) o la preferencia guardada en `localStorage` antes del primer pintado:

```tsx
import { Plus_Jakarta_Sans, Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

// Títulos, encabezados y cifras KPI: Plus Jakarta Sans
const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-plus-jakarta",
  display: "swap",
});

// Texto general / UI: Inter
const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

// Códigos, SKUs y consecutivos: IBM Plex Mono
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-ibm-plex-mono",
  display: "swap",
});

const scriptInicializacionTema = `
(function() {
  try {
    var d = document.documentElement;
    var paleta = localStorage.getItem('warengine-paleta') || 'zafiro';
    var fondo = localStorage.getItem('warengine-fondo') || 'orbes';
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

El elemento `<html>` lleva `data-paleta="zafiro"`, `data-fondo="orbes"`, `className={`${plusJakartaSans.variable} ${inter.variable} ${ibmPlexMono.variable} dark`}` y `suppressHydrationWarning`.

---

## 3. TOKENS, TEMAS Y GLASSMORPHISM (`globals.css`)

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

:root {
  --fuente-titulos: var(--font-plus-jakarta), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --fuente-texto: var(--font-inter), -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
  --fuente-codigo: var(--font-ibm-plex-mono), ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
}

.font-mono {
  font-feature-settings: "zero" 1;
}

.tabular-nums {
  font-variant-numeric: tabular-nums;
}
```

### 3.2. Los 11 Temas Oficiales + Tema Personalizado
El tema inicial por defecto es **`zafiro`** (Negro marino `#070d1a`, Azul `#3b6cf2` y Blanco). Además se definen en `globals.css` los selectores `html[data-paleta="..."]` y sus muestras `[data-muestra="..."]` para:
1. **`zafiro`** (Por defecto): base `#070d1a`, claro `#eef2f9`, luz1 `#2551d6`, luz2 `#4f46e5`, luz3 `#06b6d4`, `500: #3b6cf2`, `600: #2551d6`, texto btn `#ffffff`.
2. **`acero`** (Acero Corporativo): base `#090d14`, claro `#eef2f6`, luz1 `#2563eb`, luz2 `#475569`, luz3 `#0284c7`, `500: #3b82f6`, `600: #2563eb`.
3. **`grafito`** (Grafito y Titanio): base `#0a0c10`, claro `#f1f3f6`, luz1 `#475569`, luz2 `#334155`, luz3 `#1e3a8a`, `500: #64748b`, `600: #475569`.
4. **`indigo`** (Índigo Institucional): base `#080a18`, claro `#eef0f9`, luz1 `#4338ca`, luz2 `#3730a3`, luz3 `#1d4ed8`, `500: #6366f1`, `600: #4f46e5`.
5. **`petroleo`** (Azul Petróleo): base `#071016`, claro `#eef5f8`, luz1 `#0284c7`, luz2 `#0f766e`, luz3 `#1e3a8a`, `500: #0284c7`, `600: #0369a1`.
6. **`vino`** (Borgoña Directivo): base `#10080c`, claro `#f8f1f3`, luz1 `#be123c`, luz2 `#881337`, luz3 `#334155`, `500: #e11d48`, `600: #be123c`.
7. **`oro`** (Oro y Obsidiana): base `#0b0a08`, claro `#f7f5ef`, luz1 `#d97706`, luz2 `#b45309`, luz3 `#334155`, `500: #eab308`, `600: #ca8a04`, texto btn `#1c1917`.
8. **`violeta`**: base `#0b0816`, claro `#f3effb`, luz1 `#7c3aed`, luz2 `#c026d3`, luz3 `#3b82f6`, `500: #8b5cf6`, `600: #7c3aed`.
9. **`cian`**: base `#0a0f14`, claro `#ecf6f9`, luz1 `#06b6d4`, luz2 `#0ea5e9`, luz3 `#475569`, `500: #22d3ee`, `600: #06b6d4`, texto btn `#04202b`.
10. **`esmeralda`**: base `#06110f`, claro `#edf7f5`, luz1 `#10b981`, luz2 `#14b8a6`, luz3 `#0ea5e9`, `500: #14b8a6`, `600: #0d9488`, texto btn `#04231f`.
11. **`cobre`**: base `#120c07`, claro `#faf3ec`, luz1 `#ea580c`, luz2 `#d97706`, luz3 `#78350f`, `500: #f97316`, `600: #ea580c`.
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
  /* Barra superior y sidebar al 94% de opacidad para que NADA se lea a través al hacer scroll */
  --vidrio-fuerte-bg: color-mix(in srgb, var(--p-base, #070d1a) 94%, transparent);
  --vidrio-fuerte-borde: rgba(255, 255, 255, 0.12);
  --vidrio-fuerte-sombra: 0 4px 20px -2px rgba(0, 0, 0, 0.4), 0 1px 3px rgba(0, 0, 0, 0.2);
  --vidrio-borde: rgba(255, 255, 255, 0.08);
  --vidrio-sombra: 0 8px 32px rgba(0, 0, 0, 0.35), inset 0 1px 0 rgba(255, 255, 255, 0.08);
  --vidrio-fallback: rgba(17, 25, 45, 0.95);
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
}
```

---

## 4. GENERADOR DE PALETA PERSONALIZADA (`src/datos/generadorPaleta.ts`)

Utilitario puro en TypeScript (sin librerías externas) que:
- Exporta `CATALOGO_COLORES_ACENTO` (**12 colores bien diferenciados**: Azul Zafiro `#3b6cf2`, Azul Petróleo `#0284c7`, Cian Ártico `#06b6d4`, Turquesa Jade `#14b8a6`, Esmeralda `#10b981`, Lima Ejecutivo `#65a30d`, Oro Financiero `#eab308`, Naranja Cobre `#f97316`, Borgoña Imperial `#e11d48`, Violeta `#8b5cf6`, Índigo `#6366f1`, Grafito Titanio `#64748b`).
- Exporta `CATALOGO_COLORES_FONDO` (**12 tonos oscuros profundos**).
- Calcula mediante mezcla RGB (`mezclarHex`) toda la escala `--p-50` a `--p-950` a partir del color de acento elegido y determina automáticamente el contraste WCAG AA de `--p-btn-texto` (`#ffffff` vs `#0f172a`).
- Inyecta o limpia las variables `--p-*` en `document.documentElement.style`.

---

## 5. PANEL "APARIENCIA DEL DASHBOARD" (`src/componentes/SelectorPaleta.tsx`)

El botón en la Barra Superior muestra el ícono `Palette`, 2 círculos de muestra y el nombre del tema activo (o `"Personalizado"`). Al abrirse, despliega un popover `.vidrio-popover` en **una sola vista sin pestañas**, ordenado de arriba hacia abajo por frecuencia de uso:

1. **MODO**: Control segmentado de 2 opciones (`Oscuro` | `Claro`) en la parte superior.
2. **TEMAS**: Una única cuadrícula de **3 columnas** (`grid-cols-3 gap-1.5`) con los 11 temas unificados (sin dividir en secciones ni mostrar descripciones). Cada tarjeta muestra únicamente los 3 círculos de color + check si está activo + el nombre del tema.
3. **EFECTO DE FONDO**: Control segmentado de 3 opciones (`Orbes difusos` | `Aurora ambiental` | `Retícula + luz`).
4. **PERSONALIZAR COLORES (AVANZADO)**: Acordeón colapsable al final del panel, **cerrado por defecto** para que el panel quepa completo sin scroll en pantallas `1366x768`:
   - 5 roles con nombres claros: `Color de acento`, `Fondo`, `Brillo principal`, `Brillo secundario`, `Brillo terciario`.
   - Cuadrícula de 12 muestras (`grid-cols-6 gap-1.5`) + selector libre `<input type="color">` con código HEX y botón `Restablecer tema`.
   - Sin textos técnicos como `"Escala generada (50–950)"` ni `"Contraste AA automático"`.

---

## 6. ARQUITECTURA EXACTA DE LA PÁGINA (`src/app/page.tsx`)

### 6.1. Encabezado de Página
- **Izquierda**:
  - Título: `<h1 className="text-2xl sm:text-3xl font-titulos font-semibold tracking-[-0.005em] text-text">Resumen de la sucursal</h1>`
  - Fecha: `<p className="text-sm font-sans font-medium text-text-muted mt-1">Jueves, 5 de noviembre de 2026</p>`
- **Derecha** (Sin botón de "Nueva factura", ya que el administrador gestiona y audita):
  - Botón secundario: `Exportar` (ícono `Download`).
  - Botón primario: `Ver inventario` (ícono `Package`, navega al módulo de inventario).

---

### 6.2. FILA 1: 4 Tarjetas KPI (`TarjetaKpi.tsx`)
Cuadrícula `grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-6 items-stretch`:
1. **Ventas del día**: `$8.450.000` | Badge `success`: `▲ 12,5 %` | `vs. ayer` | Ícono `DollarSign`
2. **Facturas emitidas**: `142` | Badge `success`: `▲ 8,2 %` | `vs. ayer` | Ícono `Receipt`
3. **Stock bajo**: `5` | Badge `danger`: `2 críticos` | `quiebre inminente` | Ícono `AlertTriangle`
4. **En mantenimiento**: `8` | Badge `warning`: `1 en reparación` | `de 142 equipos` | Ícono `Wrench`

**Regla de alineación en `TarjetaKpi.tsx`**:
- Fila superior con altura fija `h-10` para la etiqueta y el recuadro de ícono `w-10 h-10 rounded-xl`.
- Valor numérico siempre en la misma línea horizontal: `text-3xl font-titulos font-semibold tracking-[-0.005em] text-text tabular-nums leading-none`.
- Fila inferior con `min-h-[34px]`: si el texto secundario baja debajo del badge en pantallas estrechas, el número principal jamás se desalinea.

---

### 6.3. FILA 2: "Rendimiento de ventas" (2/3) + "Requiere atención" (1/3)
Cuadrícula `grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch` donde ambas columnas tienen `flex flex-col h-full`:

#### A. Tarjeta "Rendimiento de ventas" (`GraficoVentas.tsx` — `lg:col-span-2`)
- **Cabecera**: Título `"Rendimiento de ventas"`, subtítulo `"Facturación consolidada de los últimos 7 días en Sucursal Centro"`, y conmutador segmentado `Barras` | `Curva analítica`.
- **Área del gráfico (`flex-1 min-h-[280px] max-h-[420px] w-full relative`)**:
  - Usa un **`ResizeObserver`** sobre el contenedor para medir el `width` y `height` reales en píxeles y configurar dinámicamente `viewBox="0 0 ${anchoSvg} ${alturaTotalSvg}"`.
  - Así, las barras y la curva Bézier llenan todo el alto y ancho disponible sin dejar espacios muertos debajo y sin deformar ni estirar los textos (`text-[11px]`, `text-xs`).
- **Pie de 4 cifras resumen (`grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3.5 mt-2 border-t border-border/70`)**:
  1. `Total semana`: `$26,8 M`
  2. `Día pico`: `Jue 05 ($4,9 M)`
  3. `Promedio diario`: `$3,8 M`
  4. `Vs. sem. anterior`: `▲ +14,2 %` (en verde `text-green-700 dark:text-green-400`, marcado con comentario `// TODO` si no viene aún del endpoint).

#### B. Tarjeta "Requiere atención" (`TarjetaRequiereAtencion.tsx` — `lg:col-span-1`)
- **Cabecera**: Título `"Requiere atención"` (**sin subtítulo**) + badge de acción con ícono `AlertTriangle` y total de asuntos prioritarios.
- **Cuerpo (`flex flex-col justify-between h-full space-y-2.5 overflow-y-auto max-h-[440px] pr-0.5`)**:
  - Mide entre ~440px y ~480px (igualando al gráfico) y nunca fuerza el crecimiento de la fila.
  - **Bloque 1 — Stock crítico**: Encabezado con ícono `Package`, texto `"Stock crítico (N)"` en minúsculas normales (`font-medium`, sin `uppercase`) y enlace `"Ver inventario →"` (`whitespace-nowrap shrink-0`). Muestra **máximo 2 productos** (nombre, `SKU` en `font-mono`, cantidad `actual/mínimo unidad` en `font-sans tabular-nums` y badge `Agotado`/`Bajo`). Si hay más, botón enlace `+N productos más en alerta`.
  - **Bloque 2 — Anuladas hoy**: Encabezado `"Anuladas hoy (1 • $42.000)"` + enlace `"Ver facturas →"`. Muestra **máximo 1 factura anulada** (la más reciente, con consecutivo en `font-mono`, monto en rojo `tabular-nums`, nombre del cliente y badge `Anulada`). Si hay más, enlace `+N facturas anuladas más`.
  - **Bloque 3 — Turnos de caja**: Encabezado `"Turnos de caja (2)"` + enlace `"Ver turnos →"`. Muestra **máximo 1 turno abierto** (nombre completo del cajero sin puntos suspensivos, caja, hora de apertura y badge `Activo`). Si hay más, enlace `+N turnos más`.

---

### 6.4. FILA 3: "Últimas facturas" (2/3) + "Métodos de pago" (1/3)
Cuadrícula `grid grid-cols-1 lg:grid-cols-3 gap-6 items-stretch`:

#### A. Tabla "Últimas facturas" (`TablaFacturas.tsx` — `lg:col-span-2`)
- **Cabecera**: Título `"Últimas facturas"`, subtítulo `"Comprobantes fiscales generados en el mostrador POS y canal B2B"`, y filtros segmentados (`Todas` | `Emitidas` | `Anuladas` | `B2B`).
- **Cero scroll horizontal a 1440px y 1280px**:
  - Máximo **5 filas visibles** de `h-[52px]`.
  - **4 columnas exactas**:
    1. `CONSECUTIVO` (`26%`): Consecutivo en `font-mono text-xs font-medium text-text` y debajo la fecha/hora en `text-[11px] font-sans text-text-muted`.
    2. `CLIENTE` (`40%`): Avatar de iniciales de `32px` (`w-8 h-8 rounded-lg`) + nombre del cliente y debajo etiqueta compacta `B2B` / `B2C` (`text-[10px] font-mono`) + descripción del canal.
    3. `TOTAL` (`18%`, alineado a la derecha): Monto en `font-sans font-semibold tabular-nums`.
    4. `ESTADO` (`16%`, alineado a la derecha): Badge `Emitida` (`success`) o `Anulada` (`danger`) siempre completo sin recortes.
- **Pie de tabla**: `"Mostrando 5 de N facturas"` + enlace `"Ver todas las facturas →"`.

#### B. Tarjeta "Métodos de pago" (`MetodosPago.tsx` — `lg:col-span-1`)
- **Cabecera**: Título `"Métodos de pago"`, subtítulo `"Distribución de transacciones del día"` y badge `"142 op."`.
- **Cuerpo compacto**:
  - Gráfico Donut SVG centrado (`w-32 h-32`, radio `52`, trazos vinculados a `text-brand-500`, `text-luz-2`, `text-luz-3`, `text-brand-300`) con texto central `40 %` (`font-titulos font-semibold`) y `Transferencia`.
  - Lista inferior de 4 filas con punto de color, nombre del método, monto en `tabular-nums` y porcentaje (sin barras de progreso duplicadas ni conteo de operaciones por fila).

---

### 6.5. FILA 4: Tarjeta Compacta "Activos" (`TarjetaActivos.tsx` — Ancho Completo)
- **Cabecera**: Título `"Activos"` (sin subtítulo largo) + badge `"Total: 114 equipos"`.
- **Cuerpo compacto**:
  1. Barra segmentada horizontal fina (`h-2 rounded-full`) con los 4 estados y `title` nativo con cantidad y porcentaje (sin fila de leyenda duplicada).
  2. Cuadrícula de una sola fila en escritorio (`grid-cols-2 lg:grid-cols-4 gap-3`) con los 4 contadores: **Disponible** (`42 (37 %)` — `Operativo`), **Asignado** (`68 (60 %)` — `En uso`), **Mantenimiento** (`3 (3 %)` — `En taller`) y **Baja** (`1 (1 %)` — `Descarte`). Cada contador muestra su ícono en recuadro de `32px`, etiqueta, cifra en `font-titulos font-semibold text-xl tabular-nums`, porcentaje en `font-sans text-[11px] text-text-muted` y su `Insignia`.
