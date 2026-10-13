/**
 * HistorialSalario.ts
 *
 * Entidad de dominio que representa un registro inmutable de ajuste o asignación salarial.
 *
 * Rol en la arquitectura:
 * - Capa de Dominio (Clean Architecture).
 * - Modela el historial de cambios de salario de un empleado para garantizar trazabilidad.
 *
 * Requisito SRS:
 * - RF-ADM-C14: Historial de salarios de empleados.
 */

export class HistorialSalario {
  constructor(
    public readonly id: string,
    public readonly empleadoId: string,
    public readonly sueldo: number,
    public readonly fechaEfectiva: string,
    public readonly motivo: string | null,
    public readonly registradoPor: string,
    public readonly createdAt: Date,
    public readonly registradorNombre?: string | null,
  ) {}
}
