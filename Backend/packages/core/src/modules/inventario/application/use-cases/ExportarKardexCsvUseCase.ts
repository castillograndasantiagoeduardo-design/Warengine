import { Result, DomainError } from '@warengine/shared-kernel';
import {
  FiltrosKardex,
  IMovimientoInventarioRepository,
} from '../../domain/repositories/IMovimientoInventarioRepository.ts';
import { ResolverAlcanceSucursalUseCase } from '../../../autenticacion/application/use-cases/ResolverAlcanceSucursalUseCase.ts';
import { SucursalFueraDeAlcanceError } from '../../../autenticacion/domain/errors/AlcanceErrors.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { generarCsv } from '../utils/csv-generator.ts';

export interface ExportarKardexCsvRequest {
  productoId?: string;
  sucursalId?: number;
  tipo?: 'entrada' | 'salida' | 'ajuste_entrada' | 'ajuste_salida';
  desde?: Date;
  hasta?: Date;
  proveedorId?: number;
  limit?: number;
  actor: ActorAuditoria;
}

export interface ExportarKardexCsvResult {
  csv: string;
  total: number;
  nombreArchivo: string;
}

export type ExportarKardexCsvResponse = Result<ExportarKardexCsvResult, DomainError>;

/**
 * RF-ADM-B21: Exportación de movimientos kardex a CSV.
 * RNF-ADM-04: Aislamiento de sede. Un Administrador de Sucursal solo puede exportar
 * los movimientos de sus sucursales autorizadas. Super Admin tiene visibilidad transversal.
 */
export class ExportarKardexCsvUseCase {
  constructor(
    private readonly movimientoRepository: IMovimientoInventarioRepository,
    private readonly resolverAlcance?: ResolverAlcanceSucursalUseCase,
  ) {}

  public async execute(
    request: ExportarKardexCsvRequest,
  ): Promise<ExportarKardexCsvResponse> {
    let sucursalIdsFiltro: number[] | undefined = undefined;

    // 1. Resolver alcance de sucursal del actor (RNF-ADM-04)
    if (this.resolverAlcance) {
      const alcanceResult = await this.resolverAlcance.execute({
        usuarioId: request.actor.usuarioId,
      });
      if (alcanceResult.isFailure) {
        return Result.fail(alcanceResult.error);
      }

      const alcance = alcanceResult.value;

      if (request.sucursalId !== undefined) {
        if (!alcance.permite(request.sucursalId)) {
          return Result.fail(new SucursalFueraDeAlcanceError());
        }
      } else if (!alcance.esGlobal) {
        const autorizadas = alcance.sucursalesPermitidas() ?? [];
        if (autorizadas.length === 0) {
          const encabezadosVacio = [
            'ID_Movimiento',
            'Fecha',
            'Sucursal',
            'SKU',
            'Producto',
            'Tipo',
            'Cantidad',
            'Motivo',
            'Proveedor',
            'FacturaID',
            'Responsable',
          ];
          const csvVacio = generarCsv(encabezadosVacio, []);
          const fechaActual = new Date().toISOString().slice(0, 10);
          return Result.ok({
            csv: csvVacio,
            total: 0,
            nombreArchivo: `kardex_${fechaActual}.csv`,
          });
        }
        sucursalIdsFiltro = autorizadas;
      }
    }

    const limit = Math.min(Math.max(1, request.limit ?? 10000), 50000);

    // 2. Construir filtros para la consulta
    const filtros: FiltrosKardex = {
      productoId: request.productoId,
      sucursalId: request.sucursalId,
      sucursalIds: sucursalIdsFiltro,
      proveedorId: request.proveedorId,
      tipo: request.tipo,
      desde: request.desde,
      hasta: request.hasta,
      limit,
      offset: 0,
    };

    // 3. Consultar histórico
    const resultado = await this.movimientoRepository.consultarKardex(filtros);

    const encabezados = [
      'ID_Movimiento',
      'Fecha',
      'Sucursal',
      'SKU',
      'Producto',
      'Tipo',
      'Cantidad',
      'Motivo',
      'Proveedor',
      'FacturaID',
      'Responsable',
    ];

    const filas = resultado.items.map((item) => {
      const fechaStr =
        item.fecha instanceof Date
          ? item.fecha.toISOString()
          : String(item.fecha);

      return [
        item.id,
        fechaStr,
        item.sucursalNombre ?? item.sucursalId,
        item.productoSku ?? '',
        item.productoNombre ?? item.productoId,
        item.tipo,
        item.cantidad,
        item.motivo ?? '',
        item.proveedorNombre ?? (item.proveedorId ?? ''),
        item.facturaId ?? '',
        item.usuarioNombre ?? item.usuarioId,
      ];
    });

    const csv = generarCsv(encabezados, filas);

    const fechaActual = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `kardex_${fechaActual}.csv`;

    return Result.ok({
      csv,
      total: resultado.total,
      nombreArchivo,
    });
  }
}
