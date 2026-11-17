---
name: diseno-vistas-warengine
description: Sistema de diseño oficial de WarEngine (Glassmorphism Ejecutivo: Negro/Marino, Azul Zafiro y Blanco). Úsala siempre para crear o actualizar cualquier dashboard, vista, pantalla, tabla, formulario, modal o componente del frontend de WarEngine manteniendo consistencia total con el estándar de Admin de Sucursal.
---

# SKILL: Sistema de Diseño y Arquitectura Visual WarEngine

Esta skill define las reglas visuales, tokens CSS, tipografía, niveles de transparencia (*glassmorphism*), estructura de layout (Sidebar + Navbar) y componentes base para construir **cualquier dashboard o vista del proyecto WarEngine**, tomando como referencia canónica el **Dashboard de Administrador de Sucursal (`/admin-sucursal`)**.

---

## 1. Identidad Visual y Tema Inicial por Defecto (Negro, Azul y Blanco)

El estilo de WarEngine es **ejecutivo, sobrio, corporativo y de alta precisión**. Todas las vistas deben arrancar por defecto en **Modo Oscuro (`.dark`)** con la paleta **Zafiro Ejecutivo (`data-paleta="zafiro"`)** y el efecto de fondo **Retícula + luz (`data-fondo="malla"`)**, cuya tríada cromática base es:

1. **Negro / Marino Profundo (`#070d1a` y `#0f1b33`)**: Lienzo principal y superficies de alta densidad.
2. **Azul Ejecutivo (`#3b6cf2` y `#2551d6`)**: Acento principal de marca, botones primarios, estados activos, indicadores e iluminación ambiental.
3. **Blanco Nítido (`#f1f5f9` en oscuro / `#ffffff` en claro)**: Tipografía principal de alto contraste, brillos especulares de cristal y superficies en modo claro.

### 1.1. Tokens del Tema por Defecto (`zafiro`)

```css
:root,
html[data-paleta="zafiro"] {
  /* Lienzo base (Negro/Marino en oscuro, Blanco azulado tenue en claro) */
  --p-base: #070d1a;
  --p-base-claro: #eef2f9;

  /* Focos de iluminación ambiental detrás del cristal */
  --p-luz-1: #2551d6;
  --p-luz-2: #4f46e5;
  --p-luz-3: #06b6d4;

  /* Escala Azul de Marca (brand-50 a brand-950) */
  --p-50: #eff4ff;
  --p-100: #dbe6fe;
  --p-200: #bfd3fe;
  --p-300: #93b4fd;
  --p-400: #6090fa;
  --p-500: #3b6cf2; /* Acento principal */
  --p-600: #2551d6; /* Botones primarios y elementos activos */
  --p-700: #1e41ae;
  --p-800: #1c388c;
  --p-900: #1b326f;
  --p-950: #0f1d42;

  /* Texto sobre botón primario */
  --p-btn-texto: #ffffff;
}
```

### 1.2. Colores Semánticos de Estado (Fijos e Invariables)
Los colores de estado comunican alertas reales y **nunca cambian con el tema**:
- **Éxito (`success`)**: `#15803d` (Badges: `bg-green-50 text-green-700 dark:bg-green-500/12 dark:text-green-300`)
- **Advertencia (`warning`)**: `#b45309` (Badges: `bg-amber-50 text-amber-800 dark:bg-amber-500/12 dark:text-amber-300`)
- **Peligro / Error (`danger`)**: `#b91c1c` (Badges: `bg-red-50 text-red-700 dark:bg-red-500/12 dark:text-red-300`)
- **Información (`info`)**: `#0369a1` (Badges: `bg-sky-50 text-sky-700 dark:bg-sky-500/12 dark:text-sky-300`)

> **Regla de oro**: Prohibido usar colores hexadecimales sueltos en los componentes React. Todo debe consumir las clases de Tailwind vinculadas a variables (`bg-bg`, `text-text`, `text-text-muted`, `border-border`, `bg-brand-600`, `text-brand-300`, etc.).

---

## 2. Sistema Tipográfico Oficial (Fijo)

Se cargan **3 fuentes** para los paneles mediante `next/font/google` en `layout.tsx`, todas con `subsets: ["latin"]`, `display: "swap"` y únicamente los pesos **`["400", "500", "600"]`**:

| Variable CSS | Clase Tailwind | Fuente (`next/font/google`) | Uso estricto en todas las vistas |
| :--- | :--- | :--- | :--- |
| `--fuente-titulos` | `font-titulos` | **Plus Jakarta Sans** | Títulos de página (`h1`), títulos de tarjeta/modal (`h3`), cifras grandes de KPIs y contadores principales. |
| `--fuente-texto` | `font-sans` | **Inter** | Cuerpo de interfaz, tablas, formularios, inputs, botones, etiquetas, badges y navegación. |
| `--fuente-codigo` | `font-mono` | **IBM Plex Mono** | **Exclusivamente** para códigos: consecutivos (`FAC-2026-0891`), SKUs (`SKU-8821`), IDs, NIT/RUT y códigos de activo. |

### Reglas Tipográficas Obligatorias
1. **Cero con barra y números tabulares**:
   - `.font-mono` siempre lleva `font-feature-settings: "zero" 1;`.
   - Todo monto en dinero (`$8.450.000`), cantidad (`2/15 unid.`), porcentaje (`12,5 %`), fecha u hora debe llevar la clase **`tabular-nums`**.
   - Las cantidades con unidad (`0/10 rollos`) van en `font-sans tabular-nums`, **nunca** en `font-mono`.
2. **Jerarquía de pesos sin negritas pesadas**:
   - **Prohibido usar `font-bold` (700), `font-extrabold` (800) o `font-black` (900)**.
   - Títulos y cifras destacadas: `font-semibold` (600).
   - Etiquetas, subtítulos y encabezados de columna: `font-medium` (500).
   - Texto de lectura y celdas secundarias: `font-normal` (400).
3. **Espaciado entre letras (`tracking`)**:
   - En títulos grandes de página (`h1`) y cifras KPI grandes (`text-3xl`): `tracking-[-0.005em]`.
   - En títulos de tarjetas (`h3`, `16px–18px`): `tracking-normal` (`0`), nunca usar `tracking-tight` para evitar que las palabras se junten.
4. **Uso moderado de mayúsculas (`uppercase`)**:
   - Reservado **únicamente** para encabezados `<th>` de tablas (`text-[11px] uppercase tracking-wider font-medium text-text-muted`), separadores del Sidebar (`MENÚ`, `OPERACIONES`, `SISTEMA`) y etiquetas de sección en paneles de configuración.
   - Los subtítulos internos dentro de tarjetas usan mayúscula inicial normal con peso `font-medium` e ícono.

---

## 3. Transparencia, Capas de Cristal (Glassmorphism) y Fondo Ambiental

El efecto flotante y translúcido de WarEngine se basa en **4 niveles de superficie** sobre un fondo con iluminación ambiental difusa y retícula arquitectónica:

### 3.1. Fondo Ambiental Dinámico (`FondoAmbiental.tsx`)
Cada dashboard debe incluir detrás del contenido (`fixed inset-0 pointer-events-none -z-10 overflow-hidden`) las manchas de luz y la retícula:
- **Mancha 1 (Arriba izquierda — `--p-luz-1`)**: `absolute -top-16 -left-16 w-[480px] h-[480px] rounded-full bg-luz-1/22 dark:bg-luz-1/35 blur-[110px]`
- **Mancha 2 (Centro-izquierda / KPIs — `--p-500`)**: `absolute top-[11%] left-[22%] w-[540px] h-[350px] rounded-full bg-brand-500/22 dark:bg-brand-500/34 blur-[110px]`
- **Mancha 3 (Centro-derecha — `--p-luz-2`)**: `absolute top-[33%] right-[10%] w-[580px] h-[440px] rounded-full bg-luz-2/20 dark:bg-luz-2/32 blur-[110px]`
- **Mancha 4 (Abajo derecha — `--p-luz-3`)**: `absolute bottom-[6%] right-[4%] w-[500px] h-[440px] rounded-full bg-luz-3/16 dark:bg-luz-3/22 blur-[110px]`
- **Capa de retícula arquitectónica (`.capa-malla.trama-malla`, líneas de `1px` cada `56px` al `4%` de opacidad)** y **Textura de ruido (`.textura-ruido`, opacidad `0.03`)**.

### 3.2. Las 4 Clases de Superficie y Transparencia

| Clase CSS | Opacidad Oscuro (`.dark`) | Opacidad Claro (`.light`) | Comportamiento de filtro | Dónde usarla |
| :--- | :--- | :--- | :--- | :--- |
| **`.vidrio`** | `rgba(255, 255, 255, 0.025)` | `rgba(255, 255, 255, 0.58)` | **Sin `backdrop-filter`** (permite ver nítida la retícula `.trama-malla` a través del cristal) | **Todas las tarjetas de contenido**, KPIs, contenedores de tablas, gráficos y paneles de módulos. Incluye bisel especular superior `::before` y elevación `hover: -4px`. |
| **`.vidrio-fuerte`** | `94%` de `--p-base` (`#070d1a`) | `92%` de `#ffffff` + `--p-base-claro` | Alta densidad sin transparentar texto al hacer scroll | **Barra Superior (Navbar) y Sidebar**. |
| **`.vidrio-popover`** | `rgba(11, 17, 30, 0.95)` | `rgba(255, 255, 255, 0.96)` | `blur(28px) saturate(160%)` | **Menús desplegables, popovers, selector de apariencia, modales y diálogos flotantes**. |
| **`.superficie-control`** | `rgba(255, 255, 255, 0.05)` | `rgba(255, 255, 255, 0.65)` | Sin blur adicional | **Inputs, buscadores, botones secundarios, selectores de filtro y badges neutros**. |

### 3.3. Regla Crítica sobre `.vidrio` en Webpack (Por qué NO debe llevar `backdrop-filter: blur(20px) saturate(160%)`)

> **Problema detectado y resuelto en `/admin-sucursal`:**  
> En proyectos que usan `@tailwindcss/turbopack` (LightningCSS), escribir `-webkit-backdrop-filter` después de `backdrop-filter` provocaba que el compilador descartara `backdrop-filter` y dejara solo el prefijo `-webkit-`, el cual Chrome moderno ignora. En cambio, en **WarEngine (`next dev --webpack` con `@tailwindcss/postcss`)**, el compilador sí mantenía activo `backdrop-filter: blur(20px) saturate(160%)`.  
> Cuando `backdrop-filter: blur(20px) saturate(160%)` se aplica sobre `.vidrio`:
> 1. El `blur(20px)` difumina las líneas de `1px` de `.trama-malla` detrás de cada tarjeta hasta borrarlas por completo, haciendo que las tarjetas se vean opacas y sin cuadrícula interior.
> 2. El `saturate(160%)` multiplica por `1.6x` la saturación de la luz azul detrás de las tarjetas KPI, tiñendo las tarjetas de un relleno azul eléctrico sólido.
>
> **Solución obligatoria:** `.vidrio` y `.vidrio-fuerte` NO deben incluir `backdrop-filter: blur(...) saturate(...)` en `globals.css`. De ese modo, el fondo de `rgba(255, 255, 255, 0.025)` actúa como un cristal limpio y transparente que deja ver con total nitidez la retícula arquitectónica y la iluminación ambiental suave.

```css
/* Definición oficial obligatoria de .vidrio y .vidrio-fuerte en globals.css */
.vidrio {
  position: relative;
  background-color: var(--vidrio-bg);
  border: 1px solid var(--vidrio-borde);
  border-top-color: var(--border-top-brillo);
  border-radius: 1rem; /* 16px */
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
  background: linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.2) 50%, transparent 100%);
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

## 4. Estructura Maestra de Layout (Sidebar + Barra Superior + Contenido)

Todos los dashboards autenticados de WarEngine comparten el mismo esqueleto flotante con margen perimetral y `relative isolate`:

```tsx
<div className="min-h-screen bg-bg text-text font-sans relative isolate overflow-x-clip transition-colors duration-300">
  {/* 1. Fondo Ambiental Fijo (-z-10) */}
  <FondoAmbiental />

  {/* 2. Contenedor Principal con separación de 24px (gap-6) */}
  <div className="flex items-start p-4 sm:p-5 lg:p-6 gap-6 max-w-[1680px] mx-auto min-h-screen">
    {/* Sidebar Flotante Sticky en Desktop */}
    <div className="hidden md:block sticky top-4 self-start z-30 shrink-0">
      <BranchSidebar ... />
    </div>

    {/* Columna Derecha: Navbar Sticky + Main */}
    <div className="flex-1 min-w-0 flex flex-col gap-6">
      <BranchHeader ... />
      <main className="space-y-6 flex-1 pb-6 min-w-0">
        {/* Encabezado de la Vista + Contenido del Módulo */}
      </main>
    </div>
  </div>
</div>
```

> **Regla de contenedores intermedios**: Ningún `<main>`, `<section>` o `<div>` entre el wrapper `relative isolate` y las tarjetas `<Tarjeta>` puede tener clases de fondo sólidas (`bg-slate-*`, `bg-navy-*`, `bg-bg`, etc.) que tapen las orbes de luz o la retícula `.trama-malla`.

### 4.1. Sidebar Flotante (`BranchSidebar.tsx`)
- Usa `.vidrio-fuerte` con altura `h-[calc(100vh-2rem)]` y bordes `rounded-2xl`.
- **Dos modos**:
  - **Expandido (`w-64`)**:
    - Encabezado `h-16 px-4 flex items-center justify-between border-b border-border` con el logo `"W"` (`w-8 h-8 rounded-lg bg-brand-600 text-btn-primario-texto`), nombre `"WarEngine"`, rol `"Admin. de sucursal"` y a la extrema derecha (`ml-auto`) el botón con ícono `PanelLeftClose` para colapsar el sidebar sin sobreponerse al texto.
    - Secciones de navegación (`MENÚ`, `OPERACIONES`, `SISTEMA`).
    - Pie `p-3 border-t border-border` con el botón discreto `Cerrar sesión` (`LogOut`).
  - **Colapsado / Dock (`w-20`)**:
    - Encabezado `h-16 px-4 flex items-center justify-center border-b border-border` con solo el logo `"W"` centrado.
    - Ítems de navegación centrados en botones `w-11 h-11 rounded-xl` con `title` nativo y divisores horizontales `w-6 h-px bg-border`.
    - Pie `p-3 border-t border-border space-y-1` donde el botón de expandir (`PanelLeftOpen`) se ubica **justo arriba del botón de Cerrar sesión (`LogOut`)**.
- **Ítem activo**: `bg-brand-600/15 dark:bg-brand-500/18 border border-brand-600/30 dark:border-brand-400/40 text-brand-700 dark:text-slate-100 font-semibold`.

### 4.2. Barra Superior Flotante (`BranchHeader.tsx`)
- Contenedor `<header className="sticky top-4 z-30 w-full">` con hijo `.vidrio-fuerte px-4 sm:px-5 py-3 flex items-center justify-between gap-4`.
- **Izquierda**: Cápsula de sucursal activa + badge verde `En línea`, y buscador global con ícono `Search` (`superficie-control rounded-xl text-xs`).
- **Derecha**: Selector segmentado de período (`Hoy | 7D | 30D`), botón del popover **`SelectorPaleta`** (anclado con `relative` y `absolute right-0 top-full mt-2 z-50` para no deformar nunca el header), conmutador rápido de modo Oscuro/Claro (`Sun`/`Moon`) y acceso al perfil de usuario.

---

## 5. Catálogo de Componentes Base para Todos los Dashboards

Al construir o rediseñar cualquier dashboard o vista de módulo en WarEngine, reutiliza siempre estos componentes base:

1. **Encabezado de Vista**:
   - Izquierda: `<h1 className="text-2xl sm:text-3xl font-titulos font-semibold tracking-[-0.005em] text-text">` + subtítulo `text-sm font-sans font-medium text-text-muted mt-1`.
   - Derecha: Máximo 2 botones de acción contextuales al rol (botón secundario con `superficie-control` + botón primario con `bg-gradient-to-b from-brand-500 to-brand-600 text-btn-primario-texto`).
2. **Componente Base de Tarjeta (`Tarjeta.tsx`)**:
   - **Todas** las tarjetas del dashboard deben usar `<Tarjeta>` (`className="vidrio flex flex-col overflow-hidden"`). Prohibido crear tarjetas con rellenos propios o clases paralelas que rompan la uniformidad del cristal.
   - Cabecera opcional con `px-5 sm:px-6 py-4 border-b border-border`, título `<h3 className="text-base font-titulos font-semibold text-text tracking-normal">`, subtítulo `text-xs font-medium text-text-muted` y slot `accion` a la derecha.
3. **Tarjetas KPI (`TarjetaKpi.tsx`)**:
   - Envuelve a `<Tarjeta className="h-full">` y alinea su contenido en 3 niveles: fila superior fija (`h-10`) con etiqueta e ícono en recuadro `w-10 h-10 rounded-xl bg-brand-100 border border-brand-200 text-brand-700 dark:bg-brand-500/15 dark:border-brand-400/20 dark:text-brand-300`; cifra central en `text-3xl font-titulos font-semibold tracking-[-0.005em] tabular-nums leading-none`; fila inferior (`min-h-[34px]`) con `Insignia` semántica + período.
4. **Tablas Compactas (`TablaFacturas.tsx` / `Tabla.tsx`)**:
   - **Prohibido el scroll horizontal en escritorio (1280px y 1440px)**. Agrupa metadatos secundarios en una segunda línea debajo del dato principal para mantener 4–5 columnas máximas.
   - Filas de `h-[52px]`, encabezados `text-[11px] uppercase tracking-wider font-medium text-text-muted`, montos alineados a la derecha con `tabular-nums` y columna de estado alineada a la derecha con `Insignia` sin recortes.
5. **Insignias / Badges (`Insignia.tsx`)**:
   - Siempre acompañadas de ícono semántico (`CheckCircle2`, `AlertTriangle`, `XCircle`, `Info`) o punto de color, bordes suaves `ring-1 ring-inset` y `whitespace-nowrap`.
6. **Formato Regional**:
   - Moneda y números en formato colombiano (`es-CO`): punto para miles (`$8.450.000`), coma para decimales (`12,5 %`, `$4,9 M`).
