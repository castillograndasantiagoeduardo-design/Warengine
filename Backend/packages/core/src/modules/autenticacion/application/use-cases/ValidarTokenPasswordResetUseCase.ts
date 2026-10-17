import { Result, DomainError } from '@warengine/shared-kernel';
import { IPasswordResetRepository } from '../../domain/repositories/IPasswordResetRepository.ts';
import { TokenRecuperacionInvalidoError } from '../../domain/errors/AutenticacionErrors.ts';

export interface ValidarTokenPasswordResetRequest {
  token: string;
}

export interface ValidarTokenPasswordResetOutput {
  valido: boolean;
}

export type ValidarTokenPasswordResetResponse = Result<
  ValidarTokenPasswordResetOutput,
  DomainError
>;

export class ValidarTokenPasswordResetUseCase {
  constructor(private readonly passwordResetRepository: IPasswordResetRepository) {}

  public async execute(
    request: ValidarTokenPasswordResetRequest,
  ): Promise<ValidarTokenPasswordResetResponse> {
    const token = request.token?.trim();
    if (!token) {
      return Result.fail(new TokenRecuperacionInvalidoError());
    }

    const resetToken = await this.passwordResetRepository.buscarTokenValido(token);

    if (!resetToken || resetToken.usado || new Date() > resetToken.expiraEn) {
      return Result.fail(new TokenRecuperacionInvalidoError());
    }

    return Result.ok({ valido: true });
  }
}
