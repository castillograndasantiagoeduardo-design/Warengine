/**
 * landing.types.ts — Tipos y modelos de datos para la Landing Page de WarEngine.
 */

export interface SlideData {
  title: string;
  desc: string;
  img: string;
  bg: string;
  c: string;
  k: string;
  tc: string;
  fg: string;
}

export interface PlanData {
  id: string;
  name: string;
  price: string;
  tag?: string;
  desc: string;
  features?: string[];
  img: string;
  color: string;
  textColor: string;
  pixels: string[];
}

export interface ThemeColors {
  c: string;
  k: string;
  tc: string;
  fg: string;
}
