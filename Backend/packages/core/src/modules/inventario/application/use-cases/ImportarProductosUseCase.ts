import { Result, DomainError } from '@warengine/shared-kernel';
import { IProductoRepository } from '../../domain/repositories/IProductoRepository.ts';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IProveedorRepository } from '../../domain/repositories/IProveedorRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { ActorAuditoria } from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { parsearCSV } from '../utils/csv-parser.ts';
import {
  ItemReporteImportacion,
  ReporteImportacionProductos,
} from '@warengine/contracts';

export interface ImportarProductosRequest {
  csvContenido: string;
  actor: ActorAuditoria;
}

export type ImportarProductosResult = Result<ReporteImportacionProductos, DomainError>;

/**
 * Caso de uso: ImportarProductosUseCase (RF-ADM-B20)
 *
 * Permite cargar productos masivamente desde un archivo CSV:
 * 1. Parsea el contenido CSV con soporte a comillas y delimitadores estándar (, y ;).
 * 2. Valida cada fila bajo las reglas de catálogo maestro (SKU único, precios positivos, existencia de categorías y proveedores activos).
 * 3. Crea atómicamente cada producto válido.
 * 4. Recopila el reporte detallado de filas cargadas y rechazadas con su motivo de fallo.
 * 5. Registra evento de auditoría consolidado si se importaron productos (RNF-ADM-02).
 */
export class ImportarProductosUseCase {
  constructor(
    private readonly productoRepository: IProductoRepository,
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly proveedorRepository: IProveedorRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: ImportarProductosRequest): Promise<ImportarProductosResult> {
    const contenido = request.csvContenido?.trim();
    if (!contenido) {
      return Result.ok({
        totalFilas: 0,
        totalCargados: 0,
        totalRechazados: 0,
        filas: [],
      });
    }

    const { filas, errores } = parsearCSV(contenido);

    if (errores.length > 0 && filas.length === 0) {
      return Result.ok({
        totalFilas: 0,
        totalCargados: 0,
        totalRechazados: 0,
        filas: [
          {
            fila: 1,
            estado: 'rechazado',
            motivo: errores.join(' '),
          },
        ],
      });
    }

    const filasReporte: ItemReporteImportacion[] = [];
    const skusEnArchivo = new Set<string>();
    let totalCargados = 0;
    let totalRechazados = 0;

    for (let i = 0; i < filas.length; i++) {
      const filaNum = i + 2; // Fila 1 = encabezados
      const f = filas[i];

      const sku = f.sku?.trim();
      const nombre = f.nombre?.trim();
      const precioCompraStr = f.precioCompra?.trim();
      const precioVentaStr = f.precioVenta?.trim();
      const precioCorpStr = f.precioCorporativo?.trim();
      const categoriaIdStr = f.categoriaId?.trim();
      const proveedorIdStr = f.proveedorId?.trim();

      // Validación de SKU
      if (!sku) {
        totalRechazados++;
        filasReporte.push({
          fila: filaNum,
          nombre,
          estado: 'rechazado',
          motivo: 'El SKU es obligatorio.',
        });
        continue;
      }

      const skuKey = sku.toUpperCase();
      if (skusEnArchivo.has(skuKey)) {
        totalRechazados++;
        filasReporte.push({
          fila: filaNum,
          sku,
          nombre,
          estado: 'rechazado',
          motivo: `SKU duplicado dentro del mismo archivo CSV ("${sku}").`,
        });
        continue;
      }
      skusEnArchivo.add(skuKey);

      // Validar si ya existe en la base de datos
      const existente = await this.productoRepository.findBySku(sku);
      if (existente) {
        totalRechazados++;
        filasReporte.push({
          fila: filaNum,
          sku,
          nombre,
          estado: 'rechazado',
          motivo: `Ya existe un producto registrado con el SKU "${sku}".`,
        });
        continue;
      }

      // Validación de Nombre
      if (!nombre) {
        totalRechazados++;
        filasReporte.push({
          fila: filaNum,
          sku,
          estado: 'rechazado',
          motivo: 'El nombre del producto es obligatorio.',
        });
        continue;
      }

      // Validación de Precios
      const precioCompra = Number(precioCompraStr);
      if (!precioCompraStr || isNaN(precioCompra) || precioCompra <= 0) {
        totalRechazados++;
        filasReporte.push({
          fila: filaNum,
          sku,
          nombre,
          estado: 'rechazado',
          motivo: 'El precio de compra debe ser un número mayor a 0.',
        });
        continue;
      }

      const precioVenta = Number(precioVentaStr);
      if (!precioVentaStr || isNaN(precioVenta) || precioVenta <= 0) {
        totalRechazados++;
        filasReporte.push({
          fila: filaNum,
          sku,
          nombre,
          estado: 'rechazado',
          motivo: 'El precio de venta debe ser un número mayor a 0.',
        });
        continue;
      }

      // Precio Corporativo opcional
      let precioCorporativo: number | null = null;
      if (precioCorpStr) {
        const parsed = Number(precioCorpStr);
        if (isNaN(parsed) || parsed <= 0) {
          totalRechazados++;
          filasReporte.push({
            fila: filaNum,
            sku,
            nombre,
            estado: 'rechazado',
            motivo: 'El precio corporativo debe ser un número mayor a 0 si se proporciona.',
          });
          continue;
        }
        precioCorporativo = parsed;
      }

      // Validación de Categoría opcional
      let categoriaId: number | null = null;
      if (categoriaIdStr) {
        const catId = Number(categoriaIdStr);
        if (!Number.isInteger(catId) || catId <= 0) {
          totalRechazados++;
          filasReporte.push({
            fila: filaNum,
            sku,
            nombre,
            estado: 'rechazado',
            motivo: `El id de categoría ("${categoriaIdStr}") debe ser un número entero positivo.`,
          });
          continue;
        }

        const cat = await this.categoriaRepository.findById(catId);
        if (!cat) {
          totalRechazados++;
          filasReporte.push({
            fila: filaNum,
            sku,
            nombre,
            estado: 'rechazado',
            motivo: `La categoría con ID ${catId} no existe.`,
          });
          continue;
        }
        if (!cat.isActive) {
          totalRechazados++;
          filasReporte.push({
            fila: filaNum,
            sku,
            nombre,
            estado: 'rechazado',
            motivo: `La categoría con ID ${catId} está inactiva.`,
          });
          continue;
        }
        categoriaId = catId;
      }

      // Validación de Proveedor opcional
      let proveedorId: number | null = null;
      if (proveedorIdStr) {
        const provId = Number(proveedorIdStr);
        if (!Number.isInteger(provId) || provId <= 0) {
          totalRechazados++;
          filasReporte.push({
            fila: filaNum,
            sku,
            nombre,
            estado: 'rechazado',
            motivo: `El id de proveedor ("${proveedorIdStr}") debe ser un número entero positivo.`,
          });
          continue;
        }

        const prov = await this.proveedorRepository.findById(provId);
        if (!prov) {
          totalRechazados++;
          filasReporte.push({
            fila: filaNum,
            sku,
            nombre,
            estado: 'rechazado',
            motivo: `El proveedor con ID ${provId} no existe.`,
          });
          continue;
        }
        if (!prov.isActive) {
          totalRechazados++;
          filasReporte.push({
            fila: filaNum,
            sku,
            nombre,
            estado: 'rechazado',
            motivo: `El proveedor con ID ${provId} está inactivo.`,
          });
          continue;
        }
        proveedorId = provId;
      }

      // Si todo es válido, crear el producto
      try {
        const prod = await this.productoRepository.crear({
          sku,
          nombre,
          precioCompra,
          precioVenta,
          precioCorporativo,
          categoriaId,
          proveedorId,
          usuarioId: request.actor.usuarioId,
        });

        totalCargados++;
        filasReporte.push({
          fila: filaNum,
          sku,
          nombre,
          estado: 'cargado',
          productoId: prod.id,
        });
      } catch (err: any) {
        totalRechazados++;
        filasReporte.push({
          fila: filaNum,
          sku,
          nombre,
          estado: 'rechazado',
          motivo: err?.message ?? 'Error inesperado al persistir el producto.',
        });
      }
    }

    // Registrar auditoría consolidada si se cargó algún producto
    if (totalCargados > 0) {
      await this.auditor.registrar({
        actor: request.actor,
        accion: 'importar_masivo',
        entidad: 'productos',
        entidadId: null,
        detalles: {
          totalFilas: filas.length,
          totalCargados,
          totalRechazados,
        },
      });
    }

    return Result.ok({
      totalFilas: filas.length,
      totalCargados,
      totalRechazados,
      filas: filasReporte,
    });
  }
}
