'use client';

/**
 * PosCobroModal.tsx — Pasarela de liquidación y cobro de la terminal POS.
 */

import type { MedioPago } from '../types/pos.types';

interface PosCobroModalProps {
  isOpen: boolean;
  onClose: () => void;
  totalVenta: number;
  medioPago: MedioPago;
  onCambiarMedioPago: (medio: MedioPago) => void;
  montoEfectivoRecibido: number;
  onCambiarMontoEfectivo: (monto: number) => void;
  onAgregarDenominacion: (monto: number) => void;
  referenciaTarjeta: string;
  onCambiarReferenciaTarjeta: (ref: string) => void;
  referenciaTransferencia: string;
  onCambiarReferenciaTransferencia: (ref: string) => void;
  cambioDevuelta: number;
  esPagoValido: boolean;
  isEmitiendo: boolean;
  errorEmision: string | null;
  onConfirmarCobro: () => void;
}

export function PosCobroModal({
  isOpen,
  onClose,
  totalVenta,
  medioPago,
  onCambiarMedioPago,
  montoEfectivoRecibido,
  onCambiarMontoEfectivo,
  onAgregarDenominacion,
  referenciaTarjeta,
  onCambiarReferenciaTarjeta,
  referenciaTransferencia,
  onCambiarReferenciaTransferencia,
  cambioDevuelta,
  esPagoValido,
  isEmitiendo,
  errorEmision,
  onConfirmarCobro,
}: PosCobroModalProps) {
  if (!isOpen) return null;

  const formatoCOP = (monto: number) =>
    new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: 'COP',
      maximumFractionDigits: 0,
    }).format(monto);

  // Nota: Se eliminó el auto-relleno forzado para permitir al cajero dejar el monto en 0 libremente.

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-[#0f1b3d] border border-white/10 rounded-2xl p-6 shadow-2xl relative select-none">
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-white/40 hover:text-white text-lg cursor-pointer"
        >
          &times;
        </button>

        {/* Encabezado */}
        <div className="flex items-center justify-between border-b border-white/10 pb-4 mb-4">
          <div>
            <h3 className="font-[family-name:var(--font-anton)] text-[#e3b341] text-2xl tracking-wide uppercase">
              Liquidación de Venta
            </h3>
            <p className="text-xs text-white/60">Selecciona el medio de pago y verifica el monto</p>
          </div>
          <div className="text-right">
            <span className="text-[10px] text-white/40 uppercase block">Total a Cobrar</span>
            <span className="font-[family-name:var(--font-anton)] text-2xl text-[#e3b341] tracking-wider">
              {formatoCOP(totalVenta)}
            </span>
          </div>
        </div>

        {errorEmision && (
          <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
            {errorEmision}
          </div>
        )}

        {/* Selector de Medios de Pago */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <button
            type="button"
            onClick={() => onCambiarMedioPago('efectivo')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
              medioPago === 'efectivo'
                ? 'bg-[#e3b341]/20 border-[#e3b341] text-[#e3b341] shadow-md shadow-[#e3b341]/10'
                : 'bg-[#14213D] border-white/10 text-white/70 hover:text-white'
            }`}
          >
            <span className="text-xl">💵</span>
            <span className="text-xs font-bold font-[family-name:var(--font-ui)] uppercase">
              Efectivo
            </span>
          </button>

          <button
            type="button"
            onClick={() => onCambiarMedioPago('tarjeta')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
              medioPago === 'tarjeta'
                ? 'bg-[#e3b341]/20 border-[#e3b341] text-[#e3b341] shadow-md shadow-[#e3b341]/10'
                : 'bg-[#14213D] border-white/10 text-white/70 hover:text-white'
            }`}
          >
            <span className="text-xl">💳</span>
            <span className="text-xs font-bold font-[family-name:var(--font-ui)] uppercase">
              Tarjeta
            </span>
          </button>

          <button
            type="button"
            onClick={() => onCambiarMedioPago('transferencia')}
            className={`p-3 rounded-xl border flex flex-col items-center gap-1.5 cursor-pointer transition-all ${
              medioPago === 'transferencia'
                ? 'bg-[#e3b341]/20 border-[#e3b341] text-[#e3b341] shadow-md shadow-[#e3b341]/10'
                : 'bg-[#14213D] border-white/10 text-white/70 hover:text-white'
            }`}
          >
            <span className="text-xl">📱</span>
            <span className="text-xs font-bold font-[family-name:var(--font-ui)] uppercase">
              Transferencia
            </span>
          </button>
        </div>

        {/* Sección específica de Efectivo */}
        {medioPago === 'efectivo' && (
          <div className="space-y-4 mb-5">
            <div>
              <div className="flex justify-between items-center mb-1.5">
                <label className="text-xs font-semibold text-white/80 uppercase font-[family-name:var(--font-ui)]">
                  Monto Recibido del Cliente (COP)
                </label>
                <button
                  type="button"
                  onClick={() => onCambiarMontoEfectivo(totalVenta)}
                  className="text-[11px] text-[#e3b341] hover:underline font-[family-name:var(--font-ui)] cursor-pointer"
                >
                  Monto Exacto
                </button>
              </div>

              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 text-sm">$</span>
                <input
                  type="number"
                  min={0}
                  step={500}
                  value={montoEfectivoRecibido || ''}
                  onChange={(e) => onCambiarMontoEfectivo(parseFloat(e.target.value) || 0)}
                  placeholder="0"
                  autoFocus
                  className="w-full pl-8 pr-4 py-3 rounded-xl bg-[#0a1124] border border-white/20 text-white font-[family-name:var(--font-anton)] text-2xl tracking-wider focus:outline-none focus:border-[#e3b341]"
                />
              </div>

              {/* Botones de billetes comunes */}
              <div className="grid grid-cols-4 gap-2 mt-2">
                {[10000, 20000, 50000, 100000].map((billete) => (
                  <button
                    key={billete}
                    type="button"
                    onClick={() => onAgregarDenominacion(billete)}
                    className="py-1.5 px-2 rounded-lg bg-[#14213D] hover:bg-[#1a2b50] border border-white/10 text-white/80 hover:text-[#e3b341] text-[11px] font-[family-name:var(--font-ui)] transition-colors cursor-pointer"
                  >
                    +{formatoCOP(billete)}
                  </button>
                ))}
              </div>
            </div>

            {/* Caja de Devuelta / Cambio */}
            <div className="p-3.5 rounded-2xl bg-[#0a1124] border border-white/10 flex items-center justify-between">
              <div>
                <span className="text-[11px] uppercase font-bold text-white/50 tracking-wider font-[family-name:var(--font-ui)]">
                  Cambio / Devuelta a Entregar
                </span>
                <p className="text-xs text-white/40">
                  {montoEfectivoRecibido < totalVenta
                    ? `Faltan ${formatoCOP(totalVenta - montoEfectivoRecibido)}`
                    : 'Monto cubierto'}
                </p>
              </div>
              <span
                className={`font-[family-name:var(--font-anton)] text-2xl tracking-wider ${
                  montoEfectivoRecibido >= totalVenta ? 'text-emerald-400' : 'text-red-400'
                }`}
              >
                {formatoCOP(cambioDevuelta)}
              </span>
            </div>
          </div>
        )}

        {/* Sección Tarjeta */}
        {medioPago === 'tarjeta' && (
          <div className="mb-5 space-y-2">
            <label className="block text-xs font-semibold text-white/80 uppercase font-[family-name:var(--font-ui)]">
              Código de Aprobación / Referencia POS (Opcional)
            </label>
            <input
              type="text"
              value={referenciaTarjeta}
              onChange={(e) => onCambiarReferenciaTarjeta(e.target.value)}
              placeholder="Ej. VOUCHER-948271"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a1124] border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#e3b341]"
            />
          </div>
        )}

        {/* Sección Transferencia */}
        {medioPago === 'transferencia' && (
          <div className="mb-5 space-y-2">
            <label className="block text-xs font-semibold text-white/80 uppercase font-[family-name:var(--font-ui)]">
              Referencia / Comprobante de Transferencia (Nequi, Daviplata, Bancolombia)
            </label>
            <input
              type="text"
              value={referenciaTransferencia}
              onChange={(e) => onCambiarReferenciaTransferencia(e.target.value)}
              placeholder="Ej. M18920198"
              className="w-full px-4 py-2.5 rounded-xl bg-[#0a1124] border border-white/20 text-white placeholder:text-white/40 text-sm focus:outline-none focus:border-[#e3b341]"
            />
          </div>
        )}

        {/* Botones de Acción */}
        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isEmitiendo}
            className="w-1/3 py-3 rounded-xl border border-white/10 text-white/60 hover:text-white text-xs font-[family-name:var(--font-ui)] uppercase cursor-pointer"
          >
            Cancelar (ESC)
          </button>
          <button
            type="button"
            onClick={onConfirmarCobro}
            disabled={!esPagoValido || isEmitiendo}
            className={`w-2/3 py-3 rounded-xl font-[family-name:var(--font-ui)] text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer transition-all ${
              !esPagoValido || isEmitiendo
                ? 'bg-white/10 text-white/40 border border-white/5 cursor-not-allowed'
                : 'bg-[#e3b341] hover:bg-[#e9b949] text-black shadow-[0_4px_0_#b88a1f] active:translate-y-1 active:shadow-none'
            }`}
          >
            {isEmitiendo ? (
              <span>Emitiendo Factura...</span>
            ) : (
              <>
                <span>Emitir y Facturar</span>
                <span>&rarr;</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
