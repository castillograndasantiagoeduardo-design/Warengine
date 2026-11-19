import { TurnoCaja } from '../entities/TurnoCaja.ts';
import type { TurnoHistorialItemDto, TurnoCorteDetalleDto, HistorialTurnosQuery } from '@warengine/contracts';

export interface DatosAperturaTurno {
    usuarioId: string;
    sucursalId: number;
    fondoInicial: number;
}

export interface DatosCierreAdministrativo {
    turnoId: string;
    motivo: string;
    fondoFinal?: number;
    cerradoPor: string;
}

export interface FiltrosHistorialTurnos extends Partial<HistorialTurnosQuery> {
    sucursalIds?: number[];
}

export interface ResultadoHistorialTurnos {
    items: TurnoHistorialItemDto[];
    total: number;
    totalPaginas: number;
    page: number;
    limite: number;
}

export interface ITurnoCajaRepository {
    buscarAbiertoDeUsuario(usuarioId: string): Promise<TurnoCaja | null>;
    /** Devuelve null si la BD rechazó la apertura porque ya había un turno abierto (carrera). */
    abrir(datos: DatosAperturaTurno): Promise<TurnoCaja | null>;
    findById(id: string): Promise<TurnoCaja | null>;
    cerrar(id: string, fondoFinal: number): Promise<TurnoCaja>;
    cerrarAdministrativo?(datos: DatosCierreAdministrativo): Promise<TurnoCaja>;
    listarHistorial?(filtros: FiltrosHistorialTurnos): Promise<ResultadoHistorialTurnos>;
    obtenerCorte?(turnoId: string): Promise<TurnoCorteDetalleDto | null>;
}
