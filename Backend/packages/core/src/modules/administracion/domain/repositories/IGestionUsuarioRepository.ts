import { UsuarioGestionado } from '../entities/UsuarioGestionado.ts';

export interface FiltrosUsuarios {
  rolId?: number;
  sucursalId?: number;
  busqueda?: string;
  texto?: string;
  isActive?: boolean;
}

export interface PaginacionUsuarios {
  pagina: number;
  limite: number;
}

export interface ResultadoPaginaUsuarios {
  items: UsuarioGestionado[];
  total: number;
}

export interface NuevoUsuarioData {
  nombre: string;
  tipoDocumento: 'CC' | 'CE';
  numeroDocumento: string;
  cargo: string | null;
  sucursalId: number;
  email: string;
  passwordHash: string;
  rolId: number;
}

export interface IGestionUsuarioRepository {
  listar(filtros: FiltrosUsuarios): Promise<UsuarioGestionado[]>;
  /**
   * Página de usuarios con filtros combinables y el total sin paginar.
   * Cada usuario incluye sus sedes adicionales (RF-ADM-C10).
   */
  listarPaginado(filtros: FiltrosUsuarios, paginacion: PaginacionUsuarios): Promise<ResultadoPaginaUsuarios>;
  findById(id: string): Promise<UsuarioGestionado | null>;
  existeEmail(email: string): Promise<boolean>;
  existeDocumento(tipo: string, numero: string): Promise<boolean>;
  rolExiste(rolId: number): Promise<boolean>;
  contarSuperAdminsActivos(): Promise<number>;
  /** Crea empleado + usuario de forma atómica. */
  crear(data: NuevoUsuarioData): Promise<UsuarioGestionado>;
  /** Cambia el rol e invalida los tokens emitidos antes de `invalidarTokensEn`. */
  actualizarRol(id: string, rolId: number, invalidarTokensEn: Date): Promise<void>;
  /** Cambia el estado e invalida tokens (y revoca refresh tokens). */
  actualizarEstado(id: string, isActive: boolean, invalidarTokensEn: Date): Promise<void>;
  /** Cambia el hash de la contraseña, invalida tokens y revoca los refresh tokens. */
  actualizarPassword(id: string, passwordHash: string, invalidarTokensEn: Date): Promise<void>;
}