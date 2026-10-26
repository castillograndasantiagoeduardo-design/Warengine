'use client';

/**
 * SucursalesUsuarioModal.tsx — Sede principal + sedes adicionales autorizadas (RF-ADM-C10).
 */

import { Modal } from '@/components/ui/Modal';
import { Button3D } from '@/components/ui/Button3D';
import { Skeleton } from '@/components/ui/Skeleton';
import { Spinner } from '@/components/ui/Spinner';
import { useSucursalesUsuario } from '../../hooks/useSucursalesUsuario';
import type { Sucursal, UsuarioGestionado } from '../../types';

interface SucursalesUsuarioModalProps {
  usuario: UsuarioGestionado | null;
  sucursales: Sucursal[];
  onClose: () => void;
  onHecho: () => void;
}

export function SucursalesUsuarioModal({ usuario, sucursales, onClose, onHecho }: SucursalesUsuarioModalProps) {
  const s = useSucursalesUsuario(usuario, onHecho);
  const activas = sucursales.filter((x) => x.isActive);

  return (
    <Modal
      open={usuario !== null}
      onClose={onClose}
      locked={s.guardando}
      title="Sedes del usuario"
      description={usuario ? `${usuario.nombre} · define dónde puede operar` : undefined}
      footer={
        <>
          <Button3D size="panel" variant="navy" type="button" onClick={onClose} disabled={s.guardando}>
            Cancelar
          </Button3D>
          <Button3D size="panel" type="button" onClick={s.guardar} disabled={s.guardando || s.cargando || s.principal === null}>
            {s.guardando && <Spinner size={16} />}
            Guardar sedes
          </Button3D>
        </>
      }
    >
      {s.cargando && <Skeleton className="h-10 w-full" lines={3} />}
      {!s.cargando && s.error && <p className="text-sm text-red-300">{s.error}</p>}
      {!s.cargando && !s.error && (
        <div className="flex flex-col gap-5">
          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-wider text-white/70 font-[family-name:var(--font-pixelify)]">
              Sede principal <span className="text-[#e9b949]">*</span>
            </legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activas.map((suc) => (
                <label key={suc.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 hover:bg-white/5">
                  <input type="radio" name="principal" checked={s.principal === suc.id} onChange={() => s.cambiarPrincipal(suc.id)} className="h-5 w-5 accent-[#e3b341]" />
                  <span className="text-sm">{suc.nombre}</span>
                </label>
              ))}
            </div>
            {s.errores.sucursalPrincipalId && <p className="mt-1 text-xs text-red-300">{s.errores.sucursalPrincipalId}</p>}
          </fieldset>

          <fieldset>
            <legend className="mb-2 text-xs uppercase tracking-wider text-white/70 font-[family-name:var(--font-pixelify)]">Sedes adicionales</legend>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {activas
                .filter((suc) => suc.id !== s.principal)
                .map((suc) => (
                  <label key={suc.id} className="flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl border border-white/10 px-3 hover:bg-white/5">
                    <input type="checkbox" checked={s.adicionales.includes(suc.id)} onChange={() => s.alternarAdicional(suc.id)} className="h-5 w-5 accent-[#e3b341]" />
                    <span className="text-sm">{suc.nombre}</span>
                  </label>
                ))}
            </div>
            {s.errores.sucursalesAdicionalesIds && <p className="mt-1 text-xs text-red-300">{s.errores.sucursalesAdicionalesIds}</p>}
          </fieldset>
          <p className="text-xs text-white/55">Solo se listan sedes activas. Al guardar se cierran las sesiones del usuario.</p>
        </div>
      )}
    </Modal>
  );
}
