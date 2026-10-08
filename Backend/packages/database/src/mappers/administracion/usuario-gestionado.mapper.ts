import { UsuarioGestionado } from '@warengine/core';

export interface FilaUsuarioGestionado {
  id: string;
  nombre: string;
  email: string;
  rolId: number;
  rolNombre: string;
  sucursalId: number;
  sucursalNombre: string;
  isActive: number;
}

export function usuarioGestionadoFromRow(row: FilaUsuarioGestionado): UsuarioGestionado {
  return new UsuarioGestionado(
    row.id,
    row.nombre,
    row.email,
    row.rolId,
    row.rolNombre,
    row.sucursalId,
    row.sucursalNombre,
    row.isActive === 1,
  );
}