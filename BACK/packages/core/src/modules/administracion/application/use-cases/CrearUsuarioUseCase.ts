import { Result, DomainError } from '@warengine/shared-kernel';
import { IPasswordService } from '../../../autenticacion/domain/services/IPasswordService.ts';
import { ISucursalRepository } from '../../domain/repositories/ISucursalRepository.ts';
import { IGestionUsuarioRepository } from '../../domain/repositories/IGestionUsuarioRepository.ts';
import { UsuarioGestionado } from '../../domain/entities/UsuarioGestionado.ts';
import {
  SucursalNoEncontradaError,
  SucursalInactivaError,
  RolNoEncontradoError,
  EmailYaRegistradoError,
  DocumentoYaRegistradoError,
} from '../../domain/errors/AdministracionErrors.ts';

export interface CrearUsuarioRequest {
  nombre: string;
  tipoDocumento: 'CC' | 'CE';
  numeroDocumento: string;
  email: string;
  passwordPlain: string;
  rolId: number;
  sucursalId: number;
  cargo?: string;
}

export type CrearUsuarioResponse = Result<UsuarioGestionado, DomainError>;

export class CrearUsuarioUseCase {
  constructor(
    private readonly usuarioRepository: IGestionUsuarioRepository,
    private readonly sucursalRepository: ISucursalRepository,
    private readonly passwordService: IPasswordService,
  ) {}

  public async execute(request: CrearUsuarioRequest): Promise<CrearUsuarioResponse> {
    const sucursal = await this.sucursalRepository.findById(request.sucursalId);
    if (!sucursal) return Result.fail(new SucursalNoEncontradaError());
    if (!sucursal.isActive) return Result.fail(new SucursalInactivaError());

    if (!(await this.usuarioRepository.rolExiste(request.rolId))) {
      return Result.fail(new RolNoEncontradoError());
    }
    if (await this.usuarioRepository.existeEmail(request.email)) {
      return Result.fail(new EmailYaRegistradoError());
    }
    if (await this.usuarioRepository.existeDocumento(request.tipoDocumento, request.numeroDocumento)) {
      return Result.fail(new DocumentoYaRegistradoError());
    }

    const passwordHash = await this.passwordService.hashear(request.passwordPlain);

    const creado = await this.usuarioRepository.crear({
      nombre: request.nombre,
      tipoDocumento: request.tipoDocumento,
      numeroDocumento: request.numeroDocumento,
      cargo: request.cargo ?? null,
      sucursalId: request.sucursalId,
      email: request.email,
      passwordHash,
      rolId: request.rolId,
    });

    return Result.ok(creado);
  }
}