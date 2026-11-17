export interface ConfiguracionPaletaPersonalizada {
  acento: string;
  fondoOscuro: string;
  luz1: string;
  luz2: string;
  luz3: string;
}

export interface MuestraColorCatalogo {
  nombre: string;
  hex: string;
}

export const CATALOGO_COLORES_ACENTO: MuestraColorCatalogo[] = [
  { nombre: "Azul Zafiro", hex: "#3b6cf2" },
  { nombre: "Azul Petróleo", hex: "#0284c7" },
  { nombre: "Cian Ártico", hex: "#06b6d4" },
  { nombre: "Turquesa Jade", hex: "#14b8a6" },
  { nombre: "Esmeralda", hex: "#10b981" },
  { nombre: "Lima Ejecutivo", hex: "#65a30d" },
  { nombre: "Oro Financiero", hex: "#eab308" },
  { nombre: "Naranja Cobre", hex: "#f97316" },
  { nombre: "Borgoña Imperial", hex: "#e11d48" },
  { nombre: "Violeta", hex: "#8b5cf6" },
  { nombre: "Índigo", hex: "#6366f1" },
  { nombre: "Grafito Titanio", hex: "#64748b" },
];

export const CATALOGO_COLORES_FONDO: MuestraColorCatalogo[] = [
  { nombre: "Marino Zafiro", hex: "#070d1a" },
  { nombre: "Nórdico Petróleo", hex: "#071016" },
  { nombre: "Abismo Cian", hex: "#0a0f14" },
  { nombre: "Bosque Profundo", hex: "#06110f" },
  { nombre: "Oliva Nocturno", hex: "#0a1009" },
  { nombre: "Negro Obsidiana", hex: "#0b0a08" },
  { nombre: "Carbón Cobre", hex: "#120c07" },
  { nombre: "Vino Nocturno", hex: "#10080c" },
  { nombre: "Obsidiana Violeta", hex: "#0b0816" },
  { nombre: "Noche Índigo", hex: "#080a18" },
  { nombre: "Pizarra Acero", hex: "#090d14" },
  { nombre: "Titanio Puro", hex: "#0a0c10" },
];

export const CONFIG_BASE_POR_PALETA: Record<string, ConfiguracionPaletaPersonalizada> = {
  zafiro: {
    acento: "#3b6cf2",
    fondoOscuro: "#070d1a",
    luz1: "#2551d6",
    luz2: "#4f46e5",
    luz3: "#06b6d4",
  },
  violeta: {
    acento: "#8b5cf6",
    fondoOscuro: "#0b0816",
    luz1: "#7c3aed",
    luz2: "#c026d3",
    luz3: "#3b82f6",
  },
  cian: {
    acento: "#06b6d4",
    fondoOscuro: "#0a0f14",
    luz1: "#06b6d4",
    luz2: "#0ea5e9",
    luz3: "#475569",
  },
  esmeralda: {
    acento: "#10b981",
    fondoOscuro: "#06110f",
    luz1: "#10b981",
    luz2: "#14b8a6",
    luz3: "#0ea5e9",
  },
  cobre: {
    acento: "#f97316",
    fondoOscuro: "#120c07",
    luz1: "#ea580c",
    luz2: "#d97706",
    luz3: "#78350f",
  },
  acero: {
    acento: "#3b82f6",
    fondoOscuro: "#090d14",
    luz1: "#2563eb",
    luz2: "#475569",
    luz3: "#0284c7",
  },
  grafito: {
    acento: "#64748b",
    fondoOscuro: "#0a0c10",
    luz1: "#475569",
    luz2: "#334155",
    luz3: "#1e3a8a",
  },
  indigo: {
    acento: "#6366f1",
    fondoOscuro: "#080a18",
    luz1: "#4338ca",
    luz2: "#3730a3",
    luz3: "#1d4ed8",
  },
  petroleo: {
    acento: "#0284c7",
    fondoOscuro: "#071016",
    luz1: "#0284c7",
    luz2: "#0f766e",
    luz3: "#1e3a8a",
  },
  vino: {
    acento: "#e11d48",
    fondoOscuro: "#10080c",
    luz1: "#be123c",
    luz2: "#881337",
    luz3: "#334155",
  },
  oro: {
    acento: "#eab308",
    fondoOscuro: "#0b0a08",
    luz1: "#d97706",
    luz2: "#b45309",
    luz3: "#334155",
  },
};

function hexARgb(hex: string): [number, number, number] {
  const limpio = hex.replace("#", "").trim();
  if (limpio.length === 3) {
    const r = parseInt(limpio[0] + limpio[0], 16) || 0;
    const g = parseInt(limpio[1] + limpio[1], 16) || 0;
    const b = parseInt(limpio[2] + limpio[2], 16) || 0;
    return [r, g, b];
  }
  const num = parseInt(limpio.padEnd(6, "0").slice(0, 6), 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function rgbAHex(r: number, g: number, b: number): string {
  const aHex = (n: number) =>
    Math.max(0, Math.min(255, Math.round(n)))
      .toString(16)
      .padStart(2, "0");
  return `#${aHex(r)}${aHex(g)}${aHex(b)}`;
}

/**
 * Mezcla dos colores HEX según el porcentaje del primero (0 a 1)
 */
export function mezclarHex(hex1: string, hex2: string, peso1: number): string {
  const [r1, g1, b1] = hexARgb(hex1);
  const [r2, g2, b2] = hexARgb(hex2);
  const p = Math.max(0, Math.min(1, peso1));
  return rgbAHex(
    r1 * p + r2 * (1 - p),
    g1 * p + g2 * (1 - p),
    b1 * p + b2 * (1 - p)
  );
}

/**
 * Calcula luminancia relativa WCAG para decidir si el texto sobre botón primario
 * debe ser blanco (#ffffff) u oscuro (#0f172a)
 */
export function calcularTextoContraste(hexFondo: string): string {
  const [r, g, b] = hexARgb(hexFondo).map((v) => {
    const s = v / 255;
    return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
  });
  const luminancia = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return luminancia > 0.34 ? "#0f172a" : "#ffffff";
}

export interface VariablesCssPaleta {
  "--p-base": string;
  "--p-base-claro": string;
  "--p-luz-1": string;
  "--p-luz-2": string;
  "--p-luz-3": string;
  "--p-50": string;
  "--p-100": string;
  "--p-200": string;
  "--p-300": string;
  "--p-400": string;
  "--p-500": string;
  "--p-600": string;
  "--p-700": string;
  "--p-800": string;
  "--p-900": string;
  "--p-950": string;
  "--p-btn-texto": string;
}

/**
 * Genera todas las variables CSS (--p-*) a partir de los 5 colores elegidos por el usuario
 */
export function generarVariablesDesdeConfig(
  config: ConfiguracionPaletaPersonalizada
): VariablesCssPaleta {
  const acento = config.acento || "#3b6cf2";
  const fondoOscuro = config.fondoOscuro || "#070d1a";
  const p600 = mezclarHex(acento, "#050814", 0.88);

  return {
    "--p-base": fondoOscuro,
    "--p-base-claro": mezclarHex(acento, "#f4f6fb", 0.07),
    "--p-luz-1": config.luz1 || acento,
    "--p-luz-2": config.luz2 || p600,
    "--p-luz-3": config.luz3 || "#06b6d4",
    "--p-50": mezclarHex(acento, "#ffffff", 0.08),
    "--p-100": mezclarHex(acento, "#ffffff", 0.16),
    "--p-200": mezclarHex(acento, "#ffffff", 0.32),
    "--p-300": mezclarHex(acento, "#ffffff", 0.52),
    "--p-400": mezclarHex(acento, "#ffffff", 0.76),
    "--p-500": acento,
    "--p-600": p600,
    "--p-700": mezclarHex(acento, "#050814", 0.74),
    "--p-800": mezclarHex(acento, "#050814", 0.6),
    "--p-900": mezclarHex(acento, "#050814", 0.45),
    "--p-950": mezclarHex(acento, "#050814", 0.28),
    "--p-btn-texto": calcularTextoContraste(p600),
  };
}

// Aliases para compatibilidad con código anterior si aplica
export const generarVariablesCss = generarVariablesDesdeConfig;
export type VariablesPersonalizadas = ConfiguracionPaletaPersonalizada;
export function aplicarPaletaPersonalizada(vars: VariablesCssPaleta): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  for (const [clave, valor] of Object.entries(vars)) {
    html.style.setProperty(clave, valor);
  }
}
export function limpiarPaletaPersonalizada(): void {
  limpiarVariablesPersonalizadasEnDom();
}

const CLAVES_VARIABLES: Array<keyof VariablesCssPaleta> = [
  "--p-base",
  "--p-base-claro",
  "--p-luz-1",
  "--p-luz-2",
  "--p-luz-3",
  "--p-50",
  "--p-100",
  "--p-200",
  "--p-300",
  "--p-400",
  "--p-500",
  "--p-600",
  "--p-700",
  "--p-800",
  "--p-900",
  "--p-950",
  "--p-btn-texto",
];

/**
 * Inyecta las variables personalizadas directamente en <html>
 */
export function aplicarVariablesPersonalizadasEnDom(
  config: ConfiguracionPaletaPersonalizada
): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  const vars = generarVariablesDesdeConfig(config);
  for (const clave of CLAVES_VARIABLES) {
    html.style.setProperty(clave, vars[clave]);
  }
}

/**
 * Limpia las variables inline de <html> para que actúen las reglas CSS de las paletas recomendadas
 */
export function limpiarVariablesPersonalizadasEnDom(): void {
  if (typeof document === "undefined") return;
  const html = document.documentElement;
  for (const clave of CLAVES_VARIABLES) {
    html.style.removeProperty(clave);
  }
}
