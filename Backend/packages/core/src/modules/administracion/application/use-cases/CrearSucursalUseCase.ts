import { Result, DomainError } from '@warengine/shared-kernel';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import { Sucursal } from '../../domain/entities/Sucursal.ts';
import {
  ACCIONES_AUDITORIA,
  ActorAuditoria,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';
import { SucursalDuplicadaError } from '../../domain/errors/AdministracionErrors.ts';

export interface CrearSucursalRequest {
  nombre: string;
  direccion?: string;
  contacto?: string;
  actor: ActorAuditoria;
}

export type CrearSucursalResponse = Result<Sucursal, DomainError>;

export class CrearSucursalUseCase {
  constructor(
    private readonly sucursalRepository: ISucursalRepository,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(request: CrearSucursalRequest): Promise<CrearSucursalResponse> {
    // Regla de negocio: no pueden existir dos sucursales con el mismo nombre
    const existente = await this.sucursalRepository.findByNombre(request.nombre);
    if (existente) {
      return Result.fail(new SucursalDuplicadaError(request.nombre));
    }

    const sucursal = await this.sucursalRepository.crear({
      nombre: request.nombre,
      direccion: request.direccion ?? null,
      contacto: request.contacto ?? null,
    });

    await this.auditor.registrar({
      actor: request.actor,
      accion: ACCIONES_AUDITORIA.CREAR,
      entidad: ENTIDADES_AUDITORIA.SUCURSALES,
      entidadId: String(sucursal.id),
      detalles: {
        despues: {
          nombre: sucursal.nombre,
          direccion: sucursal.direccion,
          contacto: sucursal.contacto,
        },
      },
    });

    return Result.ok(sucursal);
  }
}