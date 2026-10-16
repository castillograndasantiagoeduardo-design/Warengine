import { Result, DomainError } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { PERMISSIONS } from '@warengine/contracts';
import { generarCsv } from '../utils/csv-generator.ts';

export interface ExportarProductosCsvRequest {
  texto?: string;
  categoriaId?: number;
  proveedorId?: number;
  isActive?: boolean;
  stockBajo?: boolean;
  sucursalId?: number;
  limit?: number;
  actor?: ActorAuditoria;
}

export interface ExportarProductosCsvResult {
  csv: string;
  total: number;
  nombreArchivo: string;
}

export type ExportarProductosCsvResponse = Result<ExportarProductosCsvResult, DomainError>;

/**
 * RF-ADM-B21: Exportación de inventario / catálogo de productos a CSV.
 * Respeta los filtros aplicados y oculta precio de compra y proveedor a usuarios
 * sin el permiso `inventario:escribir` (protección de costos / RF-FMC-B9 / RF-ADM-B14).
 */
export class ExportarProductosCsvUseCase {
  constructor(private readonly productoRepository: IProductoRepository) {}

  public async execute(
    request: ExportarProductosCsvRequest,
  ): Promise<ExportarProductosCsvResponse> {
    const limit = Math.min(Math.max(1, request.limit ?? 10000), 50000);

    const resultado = await this.productoRepository.listar({
      texto: request.texto,
      categoriaId: request.categoriaId,
      proveedorId: request.proveedorId,
      isActive: request.isActive,
      stockBajo: request.stockBajo,
      sucursalId: request.sucursalId,
      page: 1,
      limit,
    });

    const puedeVerCostos =
      request.actor?.permisos?.includes(PERMISSIONS.INVENTARIO_ESCRIBIR) ?? false;

    const encabezados = puedeVerCostos
      ? [
          'ID',
          'SKU',
          'Nombre',
          'CategoriaID',
          'ProveedorID',
          'PrecioCompra',
          'PrecioVenta',
          'PrecioCorporativo',
          'Activo',
        ]
      : [
          'ID',
          'SKU',
          'Nombre',
          'CategoriaID',
          'PrecioVenta',
          'PrecioCorporativo',
          'Activo',
        ];

    const filas = resultado.items.map((prod) => {
      const activoStr = prod.isActive ? 'SI' : 'NO';
      const precioCorp = prod.precioCorporativo !== null && prod.precioCorporativo !== undefined
        ? prod.precioCorporativo.toFixed(2)
        : '';

      if (puedeVerCostos) {
        return [
          prod.id,
          prod.sku,
          prod.nombre,
          prod.categoriaId ?? '',
          prod.proveedorId ?? '',
          prod.precioCompra.toFixed(2),
          prod.precioVenta.toFixed(2),
          precioCorp,
          activoStr,
        ];
      }

      return [
        prod.id,
        prod.sku,
        prod.nombre,
        prod.categoriaId ?? '',
        prod.precioVenta.toFixed(2),
        precioCorp,
        activoStr,
      ];
    });

    const csv = generarCsv(encabezados, filas);

    const fechaActual = new Date().toISOString().slice(0, 10);
    const nombreArchivo = `productos_${fechaActual}.csv`;

    return Result.ok({
      csv,
      total: resultado.total,
      nombreArchivo,
    });
  }
}
