/**
 * planes.data.ts — Catálogo de planes comerciales y suscripciones de WarEngine.
 */

import type { PlanData } from '../types/landing.types';

export const PLANS: PlanData[] = [
  {
    id: 'almacen',
    name: 'Almacén',
    price: '49.000',
    tag: 'Básico',
    desc: 'Control de existencias, punto de venta ágil y facturación básica para 1 sede.',
    features: [
      'POS ágil y turnos de caja',
      'Entradas, salidas y stock mínimo',
      'Catálogo y alertas de inventario',
      '1 Sucursal / 1 Caja activa',
    ],
    img: '/images/alcance/almacen.webp',
    color: '#5a74a3',
    textColor: '#9fb3d6',
    pixels: ['#dbe4f5', '#8fa3c7', '#5a74a3'],
  },
  {
    id: 'tienda',
    name: 'Tienda',
    price: '89.000',
    tag: 'Más Popular',
    desc: 'Gestión comercial integral: caja, facturación B2B, administración de sucursal y logística.',
    features: [
      'Todo lo del plan Almacén',
      'Panel Admin Sucursal y personal',
      'Venta B2B a clientes corporativos',
      'Logística y activos fijos',
      'Kardex y traslados de mercancía',
    ],
    img: '/images/alcance/tienda.webp',
    color: '#e9b949',
    textColor: '#e9b949',
    pixels: ['#fff3c4', '#f3d37a', '#e9b949'],
  },
  {
    id: 'empresario',
    name: 'Empresario',
    price: '159.000',
    tag: 'Multi-Sede + IA',
    desc: 'Gobierno corporativo total: SuperAdmin multi-sucursal, auditoría forense y Asistente IA MCP.',
    features: [
      'Todo lo del plan Tienda',
      'SuperAdmin (Sedes ilimitadas)',
      'Asistente IA MCP Gemini autónomo',
      'Auditoría forense y logs inmutables',
      'Métricas globales y salarios',
    ],
    img: '/images/alcance/oficina.webp',
    color: '#c62828',
    textColor: '#ef6b6b',
    pixels: ['#ffc9c9', '#e05252', '#c62828'],
  },
];
