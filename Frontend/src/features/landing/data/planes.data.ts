/**
 * planes.data.ts — Catálogo de planes comerciales y suscripciones de WarEngine.
 */

import type { PlanData } from '../types/landing.types';

export const PLANS: PlanData[] = [
  {
    id: 'almacen',
    name: 'Almacen',
    price: '90.000',
    desc: 'Control de entradas y salidas, manejo automatizado de inventario.',
    img: '/images/alcance/almacen.webp',
    color: '#5a74a3',
    textColor: '#9fb3d6',
    pixels: ['#dbe4f5', '#8fa3c7', '#5a74a3'],
  },
  {
    id: 'tienda',
    name: 'Tienda',
    price: '90.000',
    desc: 'Sistema POS, facturacion electronica & control de inventario.',
    img: '/images/alcance/tienda.webp',
    color: '#e9b949',
    textColor: '#e9b949',
    pixels: ['#fff3c4', '#f3d37a', '#e9b949'],
  },
  {
    id: 'duo',
    name: 'Duo',
    price: '160.000',
    tag: 'Almacen + Tienda',
    desc: 'Gestiona tus tiendas & bodegas desde cualquier lugar.',
    img: '/images/alcance/oficina.webp',
    color: '#c62828',
    textColor: '#ef6b6b',
    pixels: ['#ffc9c9', '#e05252', '#c62828'],
  },
];
