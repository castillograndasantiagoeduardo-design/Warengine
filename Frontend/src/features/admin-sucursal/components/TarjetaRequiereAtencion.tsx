'use client';

/**
 * TarjetaRequiereAtencion.tsx — Tarjeta de alertas operativas prioritarias de la sede.
 *
 * Estructura compacta en 3 bloques:
 * 1. Stock crítico (máx 2 productos + enlace "+N productos más en alerta")
 * 2. Anuladas hoy (máx 1 factura + enlace "+N facturas anuladas más")
 * 3. Turnos de caja (máx 1 turno + enlace "+N turnos más")
 */

import React from 'react';
import {
  AlertTriangle,
  Package,
  Receipt,
  UsersRound,
  ArrowRight,
} from 'lucide-react';
import { Insignia } from './Insignia';
import { formatCOP } from '@/lib/format/moneda';
import type { AlertaStockItem, CashierShiftItem } from '../types/branch-dashboard.types';

export interface FacturaAnuladaItem {
  id: string;
  consecutivo: string;
  clienteNombre: string;
  total: number;
  hora: string;
}

export interface TarjetaRequiereAtencionProps {
  stockCritico?: AlertaStockItem[];
  facturasAnuladas?: FacturaAnuladaItem[];
  turnosAbiertos?: CashierShiftItem[];
  onVerInventario?: () => void;
  onVerFacturas?: () => void;
  onVerTurnos?: () => void;
  className?: string;
}

export function TarjetaRequiereAtencion({
  stockCritico = [],
  facturasAnuladas = [],
  turnosAbiertos = [],
  onVerInventario,
  onVerFacturas,
  onVerTurnos,
  className = '',
}: TarjetaRequiereAtencionProps) {
  // Datos reales o de respaldo según especificación si la BD está en blanco
  // TODO: respaldo de especificación si aún no hay stock crítico en BD
  const itemsStock: AlertaStockItem[] =
    stockCritico.length > 0
      ? stockCritico
      : [
          {
            id: 'demo-1',
            sku: 'SKU-8821',
            nombre: 'Disco Diamantado 4.5"',
            stockActual: 0,
            stockMinimo: 10,
            estado: 'critico',
          },
          {
            id: 'demo-2',
            sku: 'SKU-4109',
            nombre: 'Guante Carnaza Reforzado',
            stockActual: 2,
            stockMinimo: 15,
            estado: 'bajo',
          },
        ];

  // TODO: respaldo de especificación si aún no hay facturas anuladas hoy
  const itemsAnuladas: FacturaAnuladaItem[] =
    facturasAnuladas.length > 0
      ? facturasAnuladas
      : [
          {
            id: 'demo-anulada',
            consecutivo: 'FAC-2026-0891',
            clienteNombre: 'Distribuidora del Norte S.A.S.',
            total: 42000,
            hora: '14:23',
          },
        ];

  // TODO: respaldo de especificación si aún no hay turnos activos
  const itemsTurnos: CashierShiftItem[] =
    turnosAbiertos.length > 0
      ? turnosAbiertos
      : [
          {
            id: 'demo-turno',
            cajeroNombre: 'Carlos Eduardo Mendoza',
            cajeroIniciales: 'CM',
            cajaNumero: 'Caja 01',
            horaInicio: '07:45',
            totalVentas: 3450000,
            totalVentasFormateado: '$3.450.000',
            cantidadVentas: 48,
            estado: 'abierto',
          },
        ];

  const totalAsuntos =
    itemsStock.length + itemsAnuladas.length + itemsTurnos.length;

  const totalMontoAnulado = itemsAnuladas.reduce((acc, f) => acc + f.total, 0);

  const stockVisibles = itemsStock.slice(0, 2);
  const stockRestantes = Math.max(0, itemsStock.length - 2);

  const anuladaVisible = itemsAnuladas[0];
  const anuladasRestantes = Math.max(0, itemsAnuladas.length - 1);

  const turnoVisible = itemsTurnos[0];
  const turnosRestantes = Math.max(0, itemsTurnos.length - 1);

  return (
    <div
      className={`vidrio p-5 sm:p-6 flex flex-col justify-between h-full ${className}`}
    >
      {/* Cabecera: Título sin subtítulo + Badge de Acción */}
      <div className="flex items-center justify-between gap-3 mb-3 pb-3 border-b border-border">
        <h3 className="text-base font-titulos font-semibold text-text tracking-normal">
          Requiere atención
        </h3>
        <Insignia
          variante="danger"
          icono={<AlertTriangle className="w-3.5 h-3.5" />}
          tamano="sm"
        >
          {totalAsuntos} prioritarios
        </Insignia>
      </div>

      {/* Cuerpo en 3 Bloques con Scroll Suave */}
      <div className="flex-1 flex flex-col justify-between space-y-3.5 overflow-y-auto max-h-[440px] pr-0.5 custom-scrollbar">
        {/* BLOQUE 1: STOCK CRÍTICO */}
        <div className="space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-text">
              <Package className="w-3.5 h-3.5 text-brand-400" />
              <span>Stock crítico ({itemsStock.length})</span>
            </div>
            {onVerInventario && (
              <button
                type="button"
                onClick={onVerInventario}
                className="text-[11px] font-sans font-medium text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver inventario
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {stockVisibles.map((prod) => (
              <div
                key={prod.id}
                className="superficie-control rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <div className="font-sans font-medium text-text truncate">
                    {prod.nombre}
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="font-mono text-[10px] text-text-muted">
                      {prod.sku}
                    </span>
                    <span className="text-[10px] text-text-muted">·</span>
                    <span className="font-sans tabular-nums text-[11px] text-text-muted">
                      {prod.stockActual}/{prod.stockMinimo} unid.
                    </span>
                  </div>
                </div>

                <Insignia
                  variante={prod.stockActual <= 0 ? 'danger' : 'warning'}
                  tamano="sm"
                >
                  {prod.stockActual <= 0 ? 'Agotado' : 'Bajo'}
                </Insignia>
              </div>
            ))}

            {stockRestantes > 0 && onVerInventario && (
              <button
                type="button"
                onClick={onVerInventario}
                className="w-full text-center py-1 text-[11px] font-sans font-medium text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
              >
                +{stockRestantes} productos más en alerta
              </button>
            )}
          </div>
        </div>

        {/* BLOQUE 2: ANULADAS HOY */}
        <div className="space-y-2 pt-2 border-t border-border/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-text">
              <Receipt className="w-3.5 h-3.5 text-red-400" />
              <span>
                Anuladas hoy ({itemsAnuladas.length} • {formatCOP(totalMontoAnulado)})
              </span>
            </div>
            {onVerFacturas && (
              <button
                type="button"
                onClick={onVerFacturas}
                className="text-[11px] font-sans font-medium text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver facturas
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {anuladaVisible && (
            <div className="superficie-control rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs">
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-semibold text-text">
                    {anuladaVisible.consecutivo}
                  </span>
                  <span className="font-sans font-semibold text-red-500 dark:text-red-400 tabular-nums text-xs">
                    {formatCOP(anuladaVisible.total)}
                  </span>
                </div>
                <div className="font-sans text-[11px] text-text-muted truncate mt-0.5">
                  {anuladaVisible.clienteNombre}
                </div>
              </div>

              <Insignia variante="danger" tamano="sm">
                Anulada
              </Insignia>
            </div>
          )}

          {anuladasRestantes > 0 && onVerFacturas && (
            <button
              type="button"
              onClick={onVerFacturas}
              className="w-full text-center py-1 text-[11px] font-sans font-medium text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
            >
              +{anuladasRestantes} facturas anuladas más
            </button>
          )}
        </div>

        {/* BLOQUE 3: TURNOS DE CAJA */}
        <div className="space-y-2 pt-2 border-t border-border/70">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 text-xs font-sans font-medium text-text">
              <UsersRound className="w-3.5 h-3.5 text-green-400" />
              <span>Turnos de caja ({itemsTurnos.length})</span>
            </div>
            {onVerTurnos && (
              <button
                type="button"
                onClick={onVerTurnos}
                className="text-[11px] font-sans font-medium text-brand-400 hover:text-brand-300 transition-colors flex items-center gap-1 whitespace-nowrap shrink-0 cursor-pointer"
              >
                Ver turnos
                <ArrowRight className="w-3 h-3" />
              </button>
            )}
          </div>

          {turnoVisible && (
            <div className="superficie-control rounded-xl p-2.5 flex items-center justify-between gap-2.5 text-xs">
              <div className="min-w-0 flex-1">
                <div className="font-sans font-medium text-text truncate">
                  {turnoVisible.cajeroNombre}
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[11px] text-text-muted">
                  <span>{turnoVisible.cajaNumero}</span>
                  <span>·</span>
                  <span className="tabular-nums">Apertura: {turnoVisible.horaInicio}</span>
                </div>
              </div>

              <Insignia variante="success" conPunto tamano="sm">
                Activo
              </Insignia>
            </div>
          )}

          {turnosRestantes > 0 && onVerTurnos && (
            <button
              type="button"
              onClick={onVerTurnos}
              className="w-full text-center py-1 text-[11px] font-sans font-medium text-brand-400 hover:text-brand-300 transition-colors cursor-pointer"
            >
              +{turnosRestantes} turnos más
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

