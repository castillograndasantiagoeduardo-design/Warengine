'use client';

/**
 * /dashboard/usuarios — Usuarios y roles.
 */

import { RequierePermiso } from '@/components/panel/RequierePermiso';
import { UsuariosView } from '@/features/administracion/components/usuarios/UsuariosView';
import { PERMISOS_ADMIN } from '@/features/administracion/permisos';

export default function UsuariosPage() {
  return (
    <RequierePermiso permiso={PERMISOS_ADMIN.gestionarUsuarios}>
      <UsuariosView />
    </RequierePermiso>
  );
}
