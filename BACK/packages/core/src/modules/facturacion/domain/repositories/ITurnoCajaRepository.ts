import { TurnoCaja } from '../entities/TurnoCaja.ts';

export interface DatosAperturaTurno {
    usuarioId: string;
    sucursalId: number;
    fondoInicial: number;
}

export interface ITurnoCajaRepository {
    buscarAbiertoDeUsuario(usuarioId: string): Promise<TurnoCaja | null>;
    /** Devuelve null si la BD rechazó la apertura porque ya había un turno abierto (carrera). */
    abrir(datos: DatosAperturaTurno): Promise<TurnoCaja | null>;
}