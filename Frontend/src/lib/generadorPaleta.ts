/**
 * generadorPaleta.ts — Generador matemático de paletas personalizadas WarEngine.
 *
 * Principio: Utilitario puro en TypeScript (cero dependencias externas).
 * Calcula la escala tonal completa (--p-50 a --p-950) mediante mezcla RGB
 * y garantiza contraste accesible WCAG AA para el botón de acción principal.
 */

export interface ColorOpcion {
  id: string;
  nombre: string;
  hex: string;
}

export const CATALOGO_COLORES_ACENTO: ColorOpcion[] = [
  { id: 'zafiro', nombre: 'Azul Zafiro', hex: '#3b6cf2' },
  { id: 'petroleo', nombre: 'Azul Petróleo', hex: '#0284c7' },
  { id: 'cian', nombre: 'Cian Ártico', hex: '#06b6d4' },
  { id: 'turquesa', nombre: 'Turquesa Jade', hex: '#14b8a6' },
  { id: 'esmeralda', nombre: 'Esmeralda', hex: '#10b981' },
  { id: 'lima', nombre: 'Lima Ejecutivo', hex: '#65a30d' },
  { id: 'oro', nombre: 'Oro Financiero', hex: '#eab308' },
  { id: 'cobre', nombre: 'Naranja Cobre', hex: '#f97316' },
  { id: 'vino', nombre: 'Borgoña Imperial', hex: '#e11d48' },
  { id: 'violeta', nombre: 'Violeta', hex: '#8b5cf6' },
  { id: 'indigo', nombre: 'Índigo', hex: '#6366f1' },
  { id: 'grafito', nombre: 'Grafito Titanio', hex: '#64748b' },
];

export const CATALOGO_COLORES_FONDO: ColorOpcion[] = [
  { id: 'obsidiana-azul', nombre: 'Negro Marino', hex: '#070d1a' },
  { id: 'noche-titanio', nombre: 'Titanio Profundo', hex: '#090d14' },
  { id: 'grafito-puro', nombre: 'Grafito Neutro', hex: '#0a0c10' },
  { id: 'abismo-indigo', nombre: 'Abismo Índigo', hex: '#080a18' },
  { id: 'abismo-petroleo', nombre: 'Petróleo Oscuro', hex: '#071016' },
  { id: 'borgoña-negro', nombre: 'Vino Nocturno', hex: '#10080c' },
  { id: 'ambar-obsidiana', nombre: 'Obsidiana Dorada', hex: '#0b0a08' },
  { id: 'violeta-abismo', nombre: 'Sombra Violeta', hex: '#0b0816' },
  { id: 'cian-carbon', nombre: 'Carbón Ártico', hex: '#0a0f14' },
  { id: 'esmeralda-negro', nombre: 'Selva Negra', hex: '#06110f' },
  { id: 'cobre-ceniza', nombre: 'Ceniza Cobre', hex: '#120c07' },
  { id: 'espacio-puro', nombre: 'Negro Puro', hex: '#030712' },
];

interface Rgb {
  r: number;
  g: number;
  b: number;
}

function hexARgb(hex: string): Rgb {
  let c = hex.replace('#', '').trim();
  if (c.length === 3) {
    c = c.split('').map((x) => x + x).join('');
  }
  const num = parseInt(c, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

function rgbAHex(rgb: Rgb): string {
  const clamp = (v: number) => Math.max(0, Math.min(255, Math.round(v)));
  const toHex = (v: number) => clamp(v).toString(16).padStart(2, '0');
  return `#${toHex(rgb.r)}${toHex(rgb.g)}${toHex(rgb.b)}`;
}

export function mezclarHex(hex1: string, hex2: string, factor: number): string {
  const f = Math.max(0, Math.min(1, factor));
  const rgb1 = hexARgb(hex1);
  const rgb2 = hexARgb(hex2);
  return rgbAHex({
    r: rgb1.r + (rgb2.r - rgb1.r) * f,
    g: rgb1.g + (rgb2.g - rgb1.g) * f,
    b: rgb1.b + (rgb2.b - rgb1.b) * f,
  });
}

function luminanciaRelativa(rgb: Rgb): number {
  const srgb = [rgb.r / 255, rgb.g / 255, rgb.b / 255].map((v) =>
    v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)
  );
  return 0.2126 * srgb[0] + 0.7152 * srgb[1] + 0.0722 * srgb[2];
}

/** Calcula el contraste accesible WCAG AA para el texto sobre el botón de acento */
export function obtenerColorTextoBoton(colorAcentoHex: string): string {
  const lum = luminanciaRelativa(hexARgb(colorAcentoHex));
  return lum > 0.42 ? '#0f172a' : '#ffffff';
}

export interface VariablesPersonalizadas {
  acento: string;
  fondo: string;
  luz1: string;
  luz2: string;
  luz3: string;
}

/** Genera el mapa de variables CSS para inyectar en document.documentElement.style */
export function generarVariablesCss(config: VariablesPersonalizadas): Record<string, string> {
  const acento = config.acento;
  const blanco = '#ffffff';
  const negro = '#020617';

  const p50 = mezclarHex(blanco, acento, 0.12);
  const p100 = mezclarHex(blanco, acento, 0.22);
  const p200 = mezclarHex(blanco, acento, 0.38);
  const p300 = mezclarHex(blanco, acento, 0.58);
  const p400 = mezclarHex(blanco, acento, 0.82);
  const p500 = acento;
  const p600 = mezclarHex(acento, negro, 0.22);
  const p700 = mezclarHex(acento, negro, 0.38);
  const p800 = mezclarHex(acento, negro, 0.55);
  const p900 = mezclarHex(acento, negro, 0.72);
  const p950 = mezclarHex(acento, negro, 0.86);

  const btnTexto = obtenerColorTextoBoton(p600);

  return {
    '--p-base': config.fondo,
    '--p-base-claro': mezclarHex('#ffffff', config.fondo, 0.06),
    '--p-luz-1': config.luz1,
    '--p-luz-2': config.luz2,
    '--p-luz-3': config.luz3,
    '--p-50': p50,
    '--p-100': p100,
    '--p-200': p200,
    '--p-300': p300,
    '--p-400': p400,
    '--p-500': p500,
    '--p-600': p600,
    '--p-700': p700,
    '--p-800': p800,
    '--p-900': p900,
    '--p-950': p950,
    '--p-btn-texto': btnTexto,
  };
}

export function aplicarPaletaPersonalizada(varsObj: Record<string, string>): void {
  if (typeof document === 'undefined') return;
  const d = document.documentElement;
  for (const [k, v] of Object.entries(varsObj)) {
    d.style.setProperty(k, v);
  }
}

export function limpiarPaletaPersonalizada(): void {
  if (typeof document === 'undefined') return;
  const d = document.documentElement;
  const keys = [
    '--p-base',
    '--p-base-claro',
    '--p-luz-1',
    '--p-luz-2',
    '--p-luz-3',
    '--p-50',
    '--p-100',
    '--p-200',
    '--p-300',
    '--p-400',
    '--p-500',
    '--p-600',
    '--p-700',
    '--p-800',
    '--p-900',
    '--p-950',
    '--p-btn-texto',
  ];
  for (const k of keys) {
    d.style.removeProperty(k);
  }
}

