import { Result, DomainError } from '@warengine/shared-kernel';
import { IPasswordResetRepository } from '../../domain/repositories/IPasswordResetRepository.ts';
import {
  CodigoOtpInvalidoError,
  CodigoOtpExpiradoError,
  CodigoOtpBloqueadoError,
} from '../../domain/errors/AutenticacionErrors.ts';

export interface VerifyCodeRequest {
  email: string;
  code: string;
  ip?: string | null;
}

export interface VerifyCodeOutput {
  resetToken: string;
  expiraEnMinutos: number;
}

export type VerifyCodeResponse = Result<VerifyCodeOutput, DomainError>;

export class VerifyCodeUseCase {
  constructor(
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly verificadorOtp: (codigo: string, email: string, hashGuardado: string) => boolean,
    private readonly generadorResetToken: () => string,
    private readonly hasheadorResetToken: (token: string) => string,
  ) {}

  public async execute(request: VerifyCodeRequest): Promise<VerifyCodeResponse> {
    const emailNorm = request.email?.trim().toLowerCase();
    const codigo = request.code?.trim();

    // 1. Validación de formato de 4 dígitos exactos
    if (!codigo || !/^\d{4}$/.test(codigo)) {
      return Result.fail(new CodigoOtpInvalidoError('El código debe contener exactamente 4 dígitos numéricos.'));
    }

    if (!emailNorm || emailNorm.length > 150) {
      return Result.fail(new CodigoOtpInvalidoError('Correo electrónico inválido.'));
    }

    // 2. Verificación dentro de transacción con bloqueo de fila SELECT ... FOR UPDATE
    if (!this.passwordResetRepository.verificarOtpConLock) {
      return Result.fail(new CodigoOtpInvalidoError('Repositorio no soporta verificación OTP.'));
    }

    const resultado = await this.passwordResetRepository.verificarOtpConLock(
      emailNorm,
      (hashGuardado: string) => this.verificadorOtp(codigo, emailNorm, hashGuardado),
    );

    if (!resultado.exito) {
      if (resultado.motivo === 'BLOQUEADO') {
        return Result.fail(new CodigoOtpBloqueadoError());
      }
      if (resultado.motivo === 'EXPIRADO') {
        return Result.fail(new CodigoOtpExpiradoError());
      }
      if (resultado.motivo === 'CODIGO_INCORRECTO') {
        const msg =
          resultado.intentosRestantes !== undefined && resultado.intentosRestantes > 0
            ? `Código incorrecto. Te quedan ${resultado.intentosRestantes} ${resultado.intentosRestantes === 1 ? 'intento' : 'intentos'}.`
            : 'Código incorrecto.';
        return Result.fail(new CodigoOtpInvalidoError(msg, resultado.intentosRestantes));
      }
      return Result.fail(new CodigoOtpInvalidoError());
    }

    // 3. Generar resetToken de un solo uso de 64 caracteres hex (32 bytes aleatorios)
    const resetToken = this.generadorResetToken();
    const resetTokenHash = this.hasheadorResetToken(resetToken);
    const expiraEnMinutos = 15;
    const resetTokenExpiresAt = new Date(Date.now() + expiraEnMinutos * 60 * 1000);

    // 4. Asociar el token hash con la solicitud validada
    if (resultado.resetId && this.passwordResetRepository.asignarResetToken) {
      await this.passwordResetRepository.asignarResetToken(
        resultado.resetId,
        resetTokenHash,
        resetTokenExpiresAt,
      );
    }

    return Result.ok({
      resetToken,
      expiraEnMinutos,
    });
  }
}
