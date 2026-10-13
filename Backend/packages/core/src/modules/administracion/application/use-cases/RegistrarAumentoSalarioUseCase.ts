/**
 * RegistrarAumentoSalarioUseCase.ts
 *
 * Caso de uso para registrar un ajuste salarial a un empleado (aumento o cambio de remuneración).
 *
 * Rol en la arquitectura:
 * - Capa de Aplicación.
 * - Valida la existencia del colaborador y que esté laboralmente activo.
 * - Registra la mutación en `historial_salarios`, delegando la sincronización de `sueldo_actual`
 *   al trigger de base de datos (`trg_historial_salarios_sync`).
 * - Emite log de auditoría inmutable con trazabilidad del sueldo anterior y el nuevo valor.
 *
 * Requisito SRS:
 * - RF-ADM-C14: Historial de salarios de empleados.
 * - RNF-ADM-02: Auditoría inmutable de operaciones administrativas.
 */

import { DomainError, Result } from '@warengine/shared-kernel';
import { HistorialSalario } from '../../domain/entities/HistorialSalario.ts';
import { IEmpleadoRepository } from '../../domain/repositories/IEmpleadoRepository.ts';
import { IHistorialSalarioRepository } from '../../domain/repositories/IHistorialSalarioRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import {
  EmpleadoInactivoError,
  EmpleadoNoEncontradoError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface RegistrarAumentoSalarioRequest {
  empleadoId: string;
  sueldo: number;
  fechaEfectiva?: string;
  motivo?: string | null;
  actor: ActorAuditoria;
}

export type RegistrarAumentoSalarioResponse = Result<HistorialSalario, DomainError>;

export class RegistrarAumentoSalarioUseCase {
  constructor(
    private readonly empleadoRepository: IEmpleadoRepository,
    private readonly historialSalarioRepository: IHistorialSalarioRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: RegistrarAumentoSalarioRequest,
  ): Promise<RegistrarAumentoSalarioResponse> {
    const empleado = await this.empleadoRepository.findById(request.empleadoId);
    if (!empleado) {
      return Result.fail(new EmpleadoNoEncontradoError());
    }

    if (!empleado.isActive) {
      return Result.fail(new EmpleadoInactivoError());
    }

    const sueldoAnterior = empleado.sueldoActual;

    const historial = await this.historialSalarioRepository.registrar({
      empleadoId: request.empleadoId,
      sueldo: request.sueldo,
      fechaEfectiva: request.fechaEfectiva,
      motivo: request.motivo,
      registradoPor: request.actor.usuarioId,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.HISTORIAL_SALARIOS,
      entidadId: historial.id,
      detalles: {
        empleadoId: empleado.id,
        nombreEmpleado: empleado.nombre,
        sueldoAnterior,
        sueldoNuevo: historial.sueldo,
        fechaEfectiva: historial.fechaEfectiva,
        motivo: historial.motivo,
      },
    });

    return Result.ok(historial);
  }
}
