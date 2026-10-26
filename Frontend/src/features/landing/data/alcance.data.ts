/**
 * alcance.data.ts — Catálogo de slides y áreas comerciales de WarEngine.
 */

import type { SlideData } from '../types/landing.types';

export const SLIDES: SlideData[] = [
  {
    title: 'Almacen',
    desc: 'Control de inventario, compras, salidas y punto de venta ágil.',
    img: '/images/alcance/almacen.webp',
    bg: '/images/alcance/fondo_azul.webp',
    c: '#394a68',
    k: '#263349',
    tc: '#9fb3d6',
    fg: '#ffffff',
  },
  {
    title: 'Tienda',
    desc: 'Facturacion B2B, administracion de sucursal y logistica de activos.',
    img: '/images/alcance/tienda.webp',
    bg: '/images/alcance/fondo_amarillo.webp',
    c: '#e9b949',
    k: '#b88a1f',
    tc: '#e9b949',
    fg: '#111111',
  },
  {
    title: 'Empresario',
    desc: 'Gestion multi-sucursal, auditoria forense y Asistente IA MCP.',
    img: '/images/alcance/oficina.webp',
    bg: '/images/alcance/fondo_rojo.webp',
    c: '#780606',
    k: '#4a0303',
    tc: '#ef6b6b',
    fg: '#ffffff',
  },
];
