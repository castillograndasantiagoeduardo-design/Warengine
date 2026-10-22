---
name: warengine-ui
description: Sistema de diseño maestro, tokens visuales, componentes interactivos 3D y directrices frontend para WarEngine en Next.js 16, React 19 y Tailwind CSS v4.
---

# Skill: WarEngine UI & Design System

Esta skill es la guía autorizada para construir, extender y refactorizar cualquier elemento de interfaz en **WarEngine**. Establece los tokens visuales, los componentes 3D nativos, los patrones de interacción y las normas de responsive fidelity basados en la landing de referencia.

---

## 1. Cuándo Usar Esta Skill
Aplica esta skill **siempre** que vayas a:
* Crear o modificar una página, vista, ruta o layout en `Frontend/src/app/`.
* Diseñar o ajustar componentes compartidos en `Frontend/src/components/` o en `Frontend/src/features/*/components/`.
* Configurar estilos globales, tokens o fuentes en `globals.css` o `layout.tsx`.
* Construir botones, tarjetas de precios, carruseles, modales o formularios.
* Validar que la estética, tipografía, paleta de colores y microanimaciones cumplan con el estándar premium de WarEngine.

---

## 2. Tokens de Diseño y Paleta de Colores

### 2.1 Paleta Cromática Central
* **Navy (Fondo Principal):**
  * Fondo primario: `#0d1630`
  * Degradado Stage: `radial-gradient(60vw 60vh at 0% 100%, rgba(227,179,65,.55), transparent 70%), radial-gradient(70vw 70vh at 10% 0%, #14224a, transparent 70%), linear-gradient(100deg, #0f1b3d 0%, #0a0f1f 45%, #1b1b1d 100%)`
* **Dorado WarEngine (Acento Principal):**
  * Base: `--gold: #e3b341`
  * Oscuro / Sombra 3D: `--gold-dark: #b88a1f`
  * Fondo Planes / Resplandor: `#e9b949`
* **Fondos Oscuros (Secciones Secundarias / Planes):**
  * Base Planes: `#202022`
  * Tarjeta PixelCard (degradado): `linear-gradient(180deg, #17151c 0%, #0f0e13 100%)`

### 2.2 Acentos Dinámicos por Slide (Módulo ALCANCE)
Cada slide adapta el color de acento (`--ac`), sombra (`--ac-dk`), texto (`--ac-t`) y texto sobre botón (`--ac-fg`):
1. **Slide 1 — Almacén:**
   * Acento: `#394a68` | Sombra: `#263349` | Texto acento: `#9fb3d6` | Foreground: `#ffffff`
   * Píxeles tarjeta: `['#dbe4f5', '#8fa3c7', '#5a74a3']`
2. **Slide 2 — Tienda (POS):**
   * Acento: `#e9b949` | Sombra: `#b88a1f` | Texto acento: `#e9b949` | Foreground: `#111111`
   * Píxeles tarjeta: `['#fff3c4', '#f3d37a', '#e9b949']`
3. **Slide 3 — Empresario / Oficina:**
   * Acento: `#780606` | Sombra: `#4a0303` | Texto acento: `#ef6b6b` | Foreground: `#ffffff`
   * Píxeles tarjeta: `['#ffc9c9', '#e05252', '#c62828']`

---

## 3. Tipografía Oficial y Jerarquía

WarEngine utiliza cuatro familias tipográficas con roles no intercambiables:

| Familia | Rol en la Interfaz | Configuración en Next.js / CSS |
| :--- | :--- | :--- |
| **Anton** | Título principal `WARENGINE` y valores numéricos grandes de precios (`$90.000`). | Google Font `Anton`, sans-serif, weight 400, uppercase. |
| **Archivo 900** | Subtítulos descriptivos compactos (`Administracion, ventas & Logistica`). | Google Font `Archivo`, weight 900, `font-variation-settings: 'wdth' 95`. |
| **Pixelify Sans** | Botones, enlaces de navbar, etiquetas píldora, nombres de planes y textos mono. | Google Font `Pixelify Sans`, monospace, weights 400, 500, 700. |
| **Adirek Serif** | Frase icónica de remate (`A otro nivel`). Fallback: `Bodoni Moda` (cursiva, `opsz 6`). | Local font `AdirekSerif.woff2` o `Bodoni Moda` italic weight 600. |

---

## 4. Componentes Clave del Sistema

### 4.1 Botón Píldora 3D (`Button3D`)
El elemento de llamada a la acción característico de la marca. Posee relieve 3D mecánico que se hunde al presionar.
```tsx
// Regla visual del botón:
// Normal: box-shadow: 0 0.25vw 0 var(--gold-dark);
// Hover:  transform: translateY(0.22vw); box-shadow: 0 0.03vw 0 var(--gold-dark);
// Active: transform: translateY(0.25vw); box-shadow: 0 0 0 var(--gold-dark);
```

### 4.2 Navbar y Logotipo
* **Logo SVG:** Isotipo geométrico WarEngine en dos tonos (Dorado `#D9A02D` y Blanco `#ffffff`).
* **Links:** Tipografía `Pixelify Sans`, espaciado de `2.2vw` a `4.2vw`, subrayado inferior sutil `.border-b-2` activado en el color de acento actual.
* **Fondo dinámico:** En vista normal transparente; en vista móvil o modal con backdrop blur (`backdrop-blur-md bg-zinc-900/90`).

### 4.3 Robot Canvas Interactivo (`HeroRobotCanvas`)
* Componente cliente (`'use client'`).
* Maneja `<canvas>` escalado por `window.devicePixelRatio`.
* Precarga secuencial de los 116 frames WebP (`/images/robot/f_001.webp` a `/images/robot/f_116.webp`).
* En desktop con mouse: interpolación suave `lerp` (`SMOOTH = 0.09`) según posición `clientX`.
* En móvil táctil o sin mouse: bucle de reproducción continuo y autónomo.

### 4.4 Carrusel ALCANCE (`AlcanceCarousel`)
* Animación con 3 capas de profundidad:
  * Elemento central (índice actual): escala `1.0`, rotación `0deg`, opacidad `1.0`.
  * Elementos laterales vecinos: transformados con `calc(var(--d)*33vw)`, escala `0.6`, rotación `±7deg`, opacidad `0.7`.
  * Easing de desplazamiento: `cubic-bezier(.22, 1, .36, 1)` con duración `0.8s`.
  * Círculo expansivo de transición de color (*burst*).

### 4.5 Tarjeta PixelCard (`PixelCard`)
* Port nativo a React 19 con canvas de partículas en cuadrícula.
* Reacciona al hover con partículas luminosas y un foco radial de seguimiento (*spotlight*).
* Al hacer click en "Comprar" o seleccionar, aplica la animación `picked`: pulso rítmico de resplandor `1.5s ease-in-out infinite`.

### 4.6 Grano de Fondo (`NoiseOverlay`)
* Capa fija superior `pointer-events-none` con `opacity: 0.16` y `mix-blend-mode: overlay` con textura fractal SVG para eliminar gradientes en bandas.

---

## 5. Patrones de Animación y Tiempos
* **Curva de aceleración principal:** `cubic-bezier(0.22, 1, 0.36, 1)`.
* **Microinteracciones táctiles/hover:** `0.08s ease` a `0.15s ease`.
* **Transiciones de vista:** `0.6s ease` con ocultamiento de `pointer-events`.
* **Accesibilidad (`prefers-reduced-motion: reduce`):**
  * Eliminar animaciones complejas, scrub en bucle y transiciones de traslación.
  * Cambios directos de estado (`display`, `opacity: 1`) sin jank.

---

## 6. Reglas de Responsive Design
* **Breakpoint principal:** `1024px` con detección de orientación vertical (`portrait`).
* **Áreas de contacto táctil (Touch Targets):** Ningún elemento interactivo (botones, flechas, dots, links) puede medir menos de `44 x 44px`.
* **Unidades de altura:** Usar `100dvh` para evitar que la barra de navegación móvil tape botones inferiores.
* **Safe Areas:** Utilizar siempre `env(safe-area-inset-top)` y `env(safe-area-inset-bottom)`.

---

## 7. Lo que NUNCA se Debe Hacer (Prohibiciones)
1. **PROHIBIDO usar botones planos:** Todo botón principal debe tener relieve 3D mecánico con su sombra oscura correspondiente.
2. **PROHIBIDO usar fuentes no autorizadas:** No utilizar Arial, Inter, Roboto o fuentes del sistema para titulares o botones. Solo el cuarteto oficial.
3. **PROHIBIDO rutas relativas:** Nunca usar `./robot/...` o `../alcance/...`. Siempre rutas absolutas públicas `/images/...`.
4. **PROHIBIDO dependencias de registries de pago:** Todo componente interactivo se construye de forma autónoma en React 19 y Tailwind v4 sin requerir claves API ni servidores externos.
5. **PROHIBIDO omitir `'use client'`:** Cualquier componente con `useState`, `useEffect`, `useRef` o canvas debe llevar `'use client';` en la primera línea.
