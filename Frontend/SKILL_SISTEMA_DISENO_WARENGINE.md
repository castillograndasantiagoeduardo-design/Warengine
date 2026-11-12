---
name: diseno-vistas-warengine
description: Sistema de diseño oficial de WarEngine (Glassmorphism Ejecutivo: Negro/Marino, Azul Zafiro y Blanco). Úsala siempre para crear o actualizar cualquier vista, pantalla, tabla, formulario, modal o componente del frontend de WarEngine manteniendo consistencia total en colores, tipografía, tarjetas translúcidas, sidebar y barra superior.
---

# SKILL: Sistema de Diseño y Arquitectura Visual WarEngine

Esta skill define las reglas visuales, tokens CSS, tipografía, niveles de transparencia (*glassmorphism*), estructura de layout (Sidebar + Navbar) y componentes base para construir **cualquier vista del proyecto WarEngine**.

---

## 1. Identidad Visual y Tema Inicial por Defecto (Negro, Azul y Blanco)

El estilo de WarEngine es **ejecutivo, sobrio, corporativo y de alta precisión**. Todas las vistas deben arrancar por defecto en **Modo Oscuro (`.dark`)** con la paleta **Zafiro Ejecutivo (`data-paleta="zafiro"`)**, cuya tríada cromática base es:

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

Se cargan exclusivamente **3 fuentes** mediante `next/font/google` en `layout.tsx`, todas con `subsets: ["latin"]`, `display: "swap"` y únicamente los pesos **`["400", "500", "600"]`**:

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

El efecto flotante y translúcido de WarEngine se basa en **4 niveles de superficie** sobre un fondo con iluminación ambiental difusa:

### 3.1. Fondo Ambiental Dinámico (En todas las pantallas)
Cada página debe incluir detrás del contenido (`fixed inset-0 pointer-events-none -z-10 overflow-hidden`) las manchas de luz que dan vida al cristal:
- **Mancha 1 (Arriba izquierda)**: `w-[480px] h-[480px] rounded-full bg-luz-1/22 dark:bg-luz-1/35 blur-[110px]`
- **Mancha 2 (Centro-izquierda / KPIs)**: `w-[540px] h-[350px] rounded-full bg-brand-500/22 dark:bg-brand-500/34 blur-[110px]`
- **Mancha 3 (Centro-derecha)**: `w-[580px] h-[440px] rounded-full bg-luz-2/20 dark:bg-luz-2/32 blur-[110px]`
- **Mancha 4 (Abajo derecha)**: `w-[500px] h-[440px] rounded-full bg-luz-3/16 dark:bg-luz-3/22 blur-[110px]`
- **Capa de retícula opcional (`.trama-malla`)** y **Textura de ruido SVG (`.textura-ruido`, opacidad `0.028`)**.

### 3.2. Las 4 Clases de Superficie y Transparencia

| Clase CSS | Opacidad Oscuro (`.dark`) | Opacidad Claro (`.light`) | Blur / Saturación | Dónde usarla |
| :--- | :--- | :--- | :--- | :--- |
| **`.vidrio`** | `rgba(255, 255, 255, 0.025)` | `rgba(255, 255, 255, 0.58)` | `blur(20px) saturate(160%)` | **Todas las tarjetas de contenido**, contenedores de tablas, gráficos y paneles de módulos. Incluye bisel especular superior `::before` y elevación `hover: -4px`. |
| **`.vidrio-fuerte`** | `94%` de `--p-base` (`#070d1a`) | `92%` de `#ffffff` + `--p-base-claro` | `blur(28px) saturate(150%)` | **Barra Superior (Navbar) y Sidebar**. Su alta opacidad garantiza que al hacer scroll **jamás se lea el texto que pasa por detrás**. |
| **`.vidrio-popover`** | `rgba(11, 17, 30, 0.95)` | `rgba(255, 255, 255, 0.96)` | `blur(28px) saturate(160%)` | **Menús desplegables, popovers, modales y diálogos flotantes**. |
| **`.superficie-control`** | `rgba(255, 255, 255, 0.04)` | `rgba(15, 23, 42, 0.045)` | Sin blur adicional | **Inputs, buscadores, botones secundarios, selectores de filtro y badges neutros**. |

```css
/* Definición exacta de .vidrio y .vidrio-fuerte */
.vidrio {
  position: relative;
  background-color: var(--vidrio-bg);
  backdrop-filter: blur(20px) saturate(160%);
  -webkit-backdrop-filter: blur(20px) saturate(160%);
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
  backdrop-filter: blur(28px) saturate(150%);
  -webkit-backdrop-filter: blur(28px) saturate(150%);
  border: 1px solid var(--vidrio-fuerte-borde, var(--vidrio-borde));
  border-bottom: 1px solid var(--vidrio-fuerte-borde, var(--border));
  border-top-color: var(--border-top-brillo);
  border-radius: 1rem;
  box-shadow: var(--vidrio-fuerte-sombra, var(--vidrio-sombra));
}
```

---

## 4. Estructura Maestra de Layout (Sidebar + Barra Superior + Contenido)

Todas las vistas autenticadas comparten el mismo esqueleto flotante con margen perimetral:

```tsx
<div className="min-h-screen bg-bg text-text font-sans relative isolate overflow-x-clip transition-colors duration-300">
  {/* 1. Fondo Ambiental Fijo (-z-10) */}
  <FondoAmbiental />

  {/* 2. Contenedor Principal con separación de 24px (gap-6) */}
  <div className="flex items-start p-4 sm:p-5 lg:p-6 gap-6 max-w-[1680px] mx-auto min-h-screen">
    {/* Sidebar Flotante Sticky en Desktop */}
    <div className="hidden md:block sticky top-4 self-start z-30 shrink-0">
      <Sidebar ... />
    </div>

    {/* Columna Derecha: Navbar Sticky + Main */}
    <div className="flex-1 min-w-0 flex flex-col gap-6">
      <BarraSuperior ... />
      <main className="space-y-6 flex-1 pb-4">
        {/* Encabezado de la Vista + Contenido del Módulo */}
      </main>
    </div>
  </div>
</div>
```

### 4.1. Sidebar Flotante (`Sidebar.tsx`)
- Usa `.vidrio-fuerte` con altura `h-[calc(100vh-2rem)]` y bordes `rounded-2xl`.
- **Dos modos**:
  - **Expandido (`w-60`)**: Muestra logo `"W"` (`w-8 h-8 rounded-lg bg-brand-600 text-btn-primario-texto`), nombre `"WarEngine"` (`font-titulos font-semibold text-sm`), rol `"Admin. de sucursal"`, secciones (`MENÚ`, `OPERACIONES`, `SISTEMA`) y pie con avatar del usuario.
  - **Colapsado / Dock (`w-[68px]`)**: Muestra solo íconos centrados en botones `w-11 h-11 rounded-xl` con atributo `title` nativo y divisores horizontales finos.
- **Ítem activo**: `bg-brand-600/15 dark:bg-brand-500/18 border border-brand-600/30 dark:border-brand-400/40 text-brand-800 dark:text-slate-100 font-semibold`.

### 4.2. Barra Superior Flotante (`BarraSuperior.tsx`)
- Contenedor `<header className="sticky top-4 z-30 w-full">` con hijo `.vidrio-fuerte px-4 sm:px-5 py-3 flex items-center justify-between gap-4`.
- **Izquierda**: Botón hamburguesa móvil (`md:hidden`), cápsula de sucursal (`Sucursal Centro` + badge verde `En línea`), y buscador con ícono `Search` (`superficie-control rounded-xl text-xs`).
- **Derecha**: Selector segmentado de período (`Hoy | 7D | 30D | 1A`), botón del panel **`SelectorPaleta`** (Apariencia), botón rápido de modo Oscuro/Claro (`Sun`/`Moon`) y menú de perfil de usuario.

---

## 5. Catálogo de Componentes Base para Nuevas Vistas

Al construir cualquier pantalla nueva (ej. *Inventario*, *Facturación*, *Clientes*, *Personal*, *Activos*, *Reportes*), reutiliza siempre estos patrones:

1. **Encabezado de Vista**:
   - Izquierda: `<h1 className="text-2xl sm:text-3xl font-titulos font-semibold tracking-[-0.005em] text-text">` + subtítulo `text-sm font-sans font-medium text-text-muted mt-1`.
   - Derecha: Máximo 2 botones de acción contextuales al rol (`Boton` secundario con `superficie-control` + `Boton` primario con `bg-gradient-to-b from-brand-500 to-brand-600 text-btn-primario-texto`).
2. **Tarjetas Contenedoras (`Tarjeta.tsx`)**:
   - Superficie `.vidrio`, cabecera opcional con `px-5 sm:px-6 py-4 border-b border-border`, título `<h3 className="text-base font-titulos font-semibold text-text tracking-normal">`, subtítulo `text-xs font-medium text-text-muted` y slot `accion` a la derecha (para filtros segmentados o contadores).
3. **Tarjetas KPI (`TarjetaKpi.tsx`)**:
   - Estructura alineada en 3 niveles: fila superior fija (`h-10`) con etiqueta e ícono en recuadro `w-10 h-10 rounded-xl bg-brand-100 dark:bg-brand-500/15 text-brand-700 dark:text-brand-300`; cifra central en `text-3xl font-titulos font-semibold tracking-[-0.005em] tabular-nums`; fila inferior (`min-h-[34px]`) con `Insignia` semántica + período.
4. **Tablas Compactas (`Tabla.tsx`)**:
   - **Prohibido el scroll horizontal en escritorio (1280px y 1440px)**. Agrupa metadatos secundarios en una segunda línea debajo del dato principal (ej. fecha/hora bajo el consecutivo, tipo de cliente B2B/B2C bajo el nombre) para mantener entre 4 y 5 columnas máximas.
   - Filas de `h-[52px]`, encabezados `text-[11px] uppercase tracking-wider font-medium text-text-muted`, montos alineados a la derecha con `tabular-nums` y columna de estado alineada a la derecha con `Insignia` sin recortes.
5. **Insignias / Badges (`Insignia.tsx`)**:
   - Siempre acompañadas de ícono semántico (`CheckCircle2`, `AlertTriangle`, `XCircle`, `Info`) o punto de color, bordes suaves `ring-1 ring-inset` y `whitespace-nowrap`.
6. **Formato Regional**:
   - Moneda y números en formato colombiano (`es-CO`): punto para miles (`$8.450.000`), coma para decimales (`12,5 %`, `$4,9 M`).

