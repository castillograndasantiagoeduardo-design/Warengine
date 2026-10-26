/** Resumen de un turno de caja abierto para el tablero de la sucursal (solo lectura). */
export interface TurnoAbiertoResumen {
  id: string;
  usuarioId: string;
  cajeroNombre: string | null;
  cajeroEmail: string;
  sucursalId: number;
  fondoInicial: number;
  fechaApertura: Date;
  /** Facturas emitidas (no anuladas) dentro del turno. */
  cantidadVentas: number;
  totalVentas: number;
}

export interface IConsultaTurnosAbiertosRepository {
  /** Turnos sin cerrar; `sucursalIds` undefined = todas las sedes. */
  listarAbiertos(sucursalIds?: number[]): Promise<TurnoAbiertoResumen[]>;
}
