import { Result, DomainError } from '@warengine/shared-kernel';
import { ICategoriaRepository } from '../../domain/repositories/ICategoriaRepository.ts';
import { IAuditoriaService } from '../ports/auditoria.service.ts';
import { Categoria } from '../../domain/entities/Categoria.ts';

export interface CrearCategoriaRequest {
  nombre: string;
  usuarioId?: string | null;
  ip?: string | null;
}

export type CrearCategoriaResponse = Result<Categoria, DomainError>;

export class CrearCategoriaUseCase {
  constructor(
    private readonly categoriaRepository: ICategoriaRepository,
    private readonly auditoriaService: IAuditoriaService,
  ) {}

  public async execute(request: CrearCategoriaRequest): Promise<CrearCategoriaResponse> {
    const categoria = await this.categoriaRepository.crear({
      nombre: request.nombre,
    });

    await this.auditoriaService.registrar({
      usuarioId: request.usuarioId,
      accion: 'CREAR',
      entidad: 'categorias',
      entidadId: String(categoria.id),
      detalles: { nombre: categoria.nombre },
      ip: request.ip,
    });

    return Result.ok(categoria);
  }
}
