import { Usuario } from '../entities/Usuario.ts';

export interface IUsuarioRepository {
  findByEmail(email: string): Promise<Usuario | null>;
  findById(id: string): Promise<Usuario | null>;
}
