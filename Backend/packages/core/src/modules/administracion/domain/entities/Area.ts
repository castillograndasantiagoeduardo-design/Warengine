/**
 * Area.ts
 *
 * Entidad de dominio que modela un área funcional dentro de una sucursal operativa
 * (ej. Bodega, Mostrador, Despacho, Caja).
 *
 * Rol en la arquitectura:
 * - Capa de Dominio (Clean Architecture / Hexagonal).
 * - Libre de dependencias con frameworks, bases de datos o librerías de infraestructura.
 * - Modela las invariantes de negocio de las áreas funcionales.
 *
 * Requisito SRS:
 * - RF-ADM-C4: Gestión de áreas por sucursal.
 */

export class Area {
  constructor(
    public readonly id: number,
    public readonly nombre: string,
    public readonly sucursalId: number,
  ) {}
}
