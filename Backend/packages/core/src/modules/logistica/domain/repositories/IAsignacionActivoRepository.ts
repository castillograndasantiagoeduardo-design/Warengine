import { AsignacionActivo } from '../entities/AsignacionActivo.ts';

export interface DatosCrearAsignacion {
  activoId: string;
  /** Exactamente uno de los dos debe venir informado (XOR). */
  empleadoId: string | null;
  areaId: number | null;
  sucursalId: number;
  asignadoPor: string;
  fechaDevolucionEsperada: Date | null;
  observaciones: string | null;
}

export interface IAsignacionActivoRepository {
  crear(datos: DatosCrearAsignacion): Promise<AsignacionActivo>;
  findActivaPorActivo(activoId: string): Promise<AsignacionActivo | null>;
  /** Historial cronologico (mas reciente primero) de custodias pasadas y vigente. */
  listarPorActivo(activoId: string): Promise<AsignacionActivo[]>;
  /** Llena fecha_devolucion_real; el trigger la pasa a 'devuelta' y libera el activo. */
  registrarDevolucion(
    id: string,
    fechaReal: Date,
    observaciones: string | null,
  ): Promise<AsignacionActivo>;
}
