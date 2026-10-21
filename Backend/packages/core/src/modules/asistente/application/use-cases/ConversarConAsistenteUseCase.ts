import { DomainError, Result } from '@warengine/shared-kernel';
import type { IAsistenteService, PeticionAsistenteInput, RespuestaAsistenteOutput } from '../ports/IAsistenteService.ts';
import { MensajeAsistenteVacioError } from '../../domain/errors/AsistenteErrors.ts';

export class ConversarConAsistenteUseCase {
  constructor(private readonly asistenteService: IAsistenteService) {}

  public async execute(
    input: PeticionAsistenteInput,
  ): Promise<Result<RespuestaAsistenteOutput, DomainError>> {
    const mensajeLimpio = input.mensaje?.trim();
    if (!mensajeLimpio) {
      return Result.fail(new MensajeAsistenteVacioError());
    }

    return await this.asistenteService.procesarMensaje({
      ...input,
      mensaje: mensajeLimpio,
    });
  }
}
