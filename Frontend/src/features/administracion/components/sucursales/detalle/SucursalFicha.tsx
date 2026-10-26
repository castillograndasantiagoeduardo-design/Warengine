/**
 * SucursalFicha.tsx — Datos de contacto, encargado y estadísticas de la sede.
 */

import { formatCOP, formatNumero } from '@/lib/format/moneda';
import type { SucursalDetalle } from '../../../types';
import { KpiCard } from '../../dashboard/KpiCard';

interface SucursalFichaProps {
  detalle: SucursalDetalle;
  encargados: SucursalDetalle['usuariosAsignados'];
}

function Dato({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-[11px] uppercase tracking-wider text-white/50 font-[family-name:var(--font-ui)]">{label}</dt>
      <dd className="mt-1 text-sm text-white">{children}</dd>
    </div>
  );
}

export function SucursalFicha({ detalle, encargados }: SucursalFichaProps) {
  const e = detalle.estadisticas;

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
      <section className="panel-card p-5" aria-label="Datos de contacto">
        <dl className="flex flex-col gap-4">
          <Dato label="Dirección">{detalle.direccion || <span className="text-white/40">Sin registrar</span>}</Dato>
          <Dato label="Contacto">{detalle.contacto || <span className="text-white/40">Sin registrar</span>}</Dato>
          <Dato label="Encargado">
            {encargados.length > 0 ? (
              encargados.map((u) => (
                <span key={u.id} className="block">
                  {u.nombre} <span className="text-white/50">· {u.email}</span>
                </span>
              ))
            ) : (
              <span className="text-white/40">Sin admin de sucursal asignado</span>
            )}
          </Dato>
        </dl>
      </section>

      <div className="grid grid-cols-2 gap-4 lg:col-span-2">
        <KpiCard destacado icon="$" label="Ventas totales" value={formatCOP(e.montoTotalVentas)} hint={`${formatNumero(e.totalVentas)} facturas`} />
        <KpiCard icon="☺" label="Personal asignado" value={formatNumero(e.totalUsuariosAsignados)} hint="Usuarios con acceso a la sede" />
        <KpiCard icon="▦" label="Productos con stock" value={formatNumero(e.productosConStock)} hint="Referencias con existencias" />
        <KpiCard icon="∑" label="Unidades en stock" value={formatNumero(e.totalUnidadesStock)} hint="Suma de existencias" />
      </div>
    </div>
  );
}
