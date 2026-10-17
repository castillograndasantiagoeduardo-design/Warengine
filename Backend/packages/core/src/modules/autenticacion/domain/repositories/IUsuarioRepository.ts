import { Usuario } from '../entities/Usuario.ts';

export interface IUsuarioRepository {
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
  actualizarTotp?(usuarioId: string, totpSecret: string | null, requiere2fa: boolean): Promise<void>;
  actualizarPassword?(usuarioId: string, nuevoPasswordHash: string, tokensInvalidadosEn: Date): Promise<void>;
}


