'use client';

/**
 * UsuariosView.tsx — Usuarios y roles: directorio paginado, alta atómica, cambio de rol,
 * sedes (multisede), activar/desactivar y restablecer contraseña.
 */

import { useCallback, useMemo, useState } from 'react';
import { Forbidden } from '@/components/panel/Forbidden';
import { PageHeader } from '@/components/panel/PageHeader';
import { Button3D } from '@/components/ui/Button3D';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { DataTable } from '@/components/ui/DataTable';
import { EmptyState } from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { useCambiarEstadoUsuario } from '../../hooks/useAccionesUsuario';
import { useUsuarios } from '../../hooks/useUsuarios';
import type { UsuarioGestionado } from '../../types';
import { columnasUsuarios } from './usuariosColumns';
import { UsuariosFiltros } from './UsuariosFiltros';
import { CrearUsuarioModal } from './CrearUsuarioModal';
import { CambiarRolModal } from './CambiarRolModal';
import { RestablecerPasswordModal } from './RestablecerPasswordModal';
import { SucursalesUsuarioModal } from './SucursalesUsuarioModal';

export function UsuariosView() {
  const toast = useToast();
  const l = useUsuarios();
  const { recargar } = l;
  const [creando, setCreando] = useState(false);
  const [enRol, setEnRol] = useState<UsuarioGestionado | null>(null);
  const [enSedes, setEnSedes] = useState<UsuarioGestionado | null>(null);
  const [enClave, setEnClave] = useState<UsuarioGestionado | null>(null);

  const cerrarYRecargar = useCallback(() => {
    setEnRol(null);
    setEnSedes(null);
    setEnClave(null);
    recargar();
  }, [recargar]);
  const estado = useCambiarEstadoUsuario(recargar);

  // Crear exige elegir rol (catálogo de roles) y sucursal (catálogo de sedes)
  const puedeCrear = l.puede.gestionarUsuarios && l.puede.asignarRoles && l.puede.verSucursales;

  const onCreado = useCallback(
    (u: UsuarioGestionado) => {
      toast.success(`Usuario ${u.email} creado.`);
      setCreando(false);
      recargar();
    },
    [toast, recargar],
  );

  const columnas = useMemo(
    () =>
      columnasUsuarios({
        puedeAsignarRoles: l.puede.asignarRoles,
        puedeGestionar: l.puede.gestionarUsuarios,
        onRol: setEnRol,
        onSucursales: (u) => (l.puede.verSucursales ? setEnSedes(u) : toast.info('Asignar sedes requiere el permiso de gestionar sucursales.')),
        onPassword: setEnClave,
        onEstado: estado.solicitar,
      }),
    [l.puede.asignarRoles, l.puede.gestionarUsuarios, l.puede.verSucursales, estado.solicitar, toast],
  );

  return (
    <div>
      <PageHeader
        title="Usuarios y roles"
        subtitle="Cuentas de acceso, roles y sedes autorizadas"
        actions={
          puedeCrear && (
            <Button3D size="panel" type="button" onClick={() => setCreando(true)}>
              + Nuevo usuario
            </Button3D>
          )
        }
      />

      <UsuariosFiltros
        estado={l.filtros.estado}
        onEstado={(v) => l.setFiltro('estado', v)}
        rolId={l.filtros.rolId}
        onRol={(v) => l.setFiltro('rolId', v)}
        roles={l.roles}
        sucursalId={l.filtros.sucursalId}
        onSucursal={(v) => l.setFiltro('sucursalId', v)}
        sucursales={l.sucursales}
        texto={l.texto}
        onTexto={l.setTexto}
      />

      {l.denegado ? (
        <Forbidden />
      ) : l.error ? (
        <div className="panel-card">
          <EmptyState icon="⚠" title="No se pudieron cargar los usuarios" description={l.error} action={<Button3D size="panel" variant="navy" type="button" onClick={recargar}>Reintentar</Button3D>} />
        </div>
      ) : (
        <DataTable
          caption="Listado de usuarios"
          columns={columnas}
          rows={l.rows}
          rowKey={(u) => u.id}
          loading={l.loading}
          page={l.page}
          totalPages={l.totalPages}
          total={l.total}
          onPageChange={l.setPage}
          empty={<EmptyState title="Sin usuarios" description="No hay usuarios que coincidan con los filtros." />}
        />
      )}

      <CrearUsuarioModal open={creando} roles={l.roles} sucursales={l.sucursales} onClose={() => setCreando(false)} onCreado={onCreado} />
      <CambiarRolModal usuario={enRol} roles={l.roles} onClose={() => setEnRol(null)} onHecho={cerrarYRecargar} />
      <SucursalesUsuarioModal usuario={enSedes} sucursales={l.sucursales} onClose={() => setEnSedes(null)} onHecho={cerrarYRecargar} />
      <RestablecerPasswordModal usuario={enClave} onClose={() => setEnClave(null)} onHecho={cerrarYRecargar} />
      <ConfirmDialog
        open={estado.objetivo !== null}
        title={estado.objetivo?.isActive ? 'Desactivar cuenta' : 'Activar cuenta'}
        tone={estado.objetivo?.isActive ? 'danger' : 'success'}
        confirmLabel={estado.objetivo?.isActive ? 'Desactivar' : 'Activar'}
        loading={estado.procesando}
        onConfirm={estado.confirmar}
        onCancel={estado.cancelar}
        message={
          estado.objetivo?.isActive ? (
            <p>
              <strong className="text-white">{estado.objetivo?.nombre}</strong> no podrá iniciar sesión y se cerrarán sus sesiones activas.
            </p>
          ) : (
            <p>
              <strong className="text-white">{estado.objetivo?.nombre}</strong> podrá volver a iniciar sesión.
            </p>
          )
        }
      />
    </div>
  );
}
