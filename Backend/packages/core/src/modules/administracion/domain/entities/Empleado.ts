/**
 * Empleado.ts
 *
 * Entidad de dominio que modela el registro del personal laboral y contractual de Warengine.
 *
 * Rol en la arquitectura:
 * - Capa de Dominio (Clean Architecture / Hexagonal).
 * - Representa la información laboral del empleado, su adscripción a una sede/área
 *   y su estado operativo, desacoplada de la cuenta de usuario del sistema.
 *
 * Requisito SRS:
 * - RF-ADM-C6: Creación de nuevo empleado.
 * - RF-ADM-C12: Edición independiente de datos de empleados.
 * - RF-ADM-C5: Listado y filtrado de colaboradores por sucursal y área.
 */

export class Empleado {
  constructor(
    public readonly id: string,
    public readonly tipoDocumento: string,
    public readonly numeroDocumento: string,
    public readonly nombre: string,
    public readonly telefono: string | null,
    public readonly direccion: string | null,
    public readonly cargo: string | null,
    public readonly areaId: number | null,
    public readonly areaNombre: string | null,
    public readonly sucursalId: number,
    public readonly sucursalNombre: string,
    public readonly fechaIngreso: string,
    public readonly sueldoActual: number | null,
    public readonly isActive: boolean,
  ) {}
}
