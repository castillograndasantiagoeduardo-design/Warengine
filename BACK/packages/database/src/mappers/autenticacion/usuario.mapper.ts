import { Usuario } from '../../../../core/src/autenticacion/domain/entities/Usuario.ts';
import { UsuarioRecord } from '../../schema/autenticacion.schema.ts';

export function fromRow(row: UsuarioRecord): Usuario {
  return new Usuario(
    row.id_usuario,
    row.email,
    row.password_hash,
    row.rol_id,
    row.is_active === 1,
    row.requiere_2fa === 1,
    row.tokens_invalidados_en
  );
}
