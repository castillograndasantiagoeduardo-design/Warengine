import { Result, DomainError } from '@warengine/shared-kernel';
import { IUsuarioRepository } from '../../domain/repositories/IUsuarioRepository.ts';
import { IPasswordResetRepository } from '../../domain/repositories/IPasswordResetRepository.ts';
import { IMailer } from '../../domain/services/IMailer.ts';
import { LimiteSolicitudesRecuperacionExcedidoError } from '../../domain/errors/AutenticacionErrors.ts';
import { IAuditor } from '../../../auditoria/domain/repositories/IAuditoriaRepository.ts';
import {
  ACCIONES_AUDITORIA,
  ENTIDADES_AUDITORIA,
} from '../../../auditoria/domain/entities/LogAuditoria.ts';

export interface SolicitarRecuperacionPasswordRequest {
  email: string;
  ip?: string | null;
}

export interface SolicitarRecuperacionPasswordOutput {
  mensaje: string;
}

export type SolicitarRecuperacionPasswordResponse = Result<
  SolicitarRecuperacionPasswordOutput,
  DomainError
>;

export class SolicitarRecuperacionPasswordUseCase {
  constructor(
    private readonly usuarioRepository: IUsuarioRepository,
    private readonly passwordResetRepository: IPasswordResetRepository,
    private readonly mailer: IMailer,
    private readonly auditor: IAuditor,
  ) {}

  public async execute(
    request: SolicitarRecuperacionPasswordRequest,
  ): Promise<SolicitarRecuperacionPasswordResponse> {
    const emailNormalizado = request.email.trim().toLowerCase();
    const mensajeGenerico =
      'Si el correo electrónico está registrado en el sistema, recibirás un enlace para restablecer tu contraseña.';

    const usuario = await this.usuarioRepository.findByEmail(emailNormalizado);

    // RF-SA-H1 / Anti-enumeración: Si el correo no existe o el usuario está inactivo,
    // se devuelve éxito idéntico sin revelar el estado del usuario ni enviar correo.
    if (!usuario || !usuario.isActive) {
      return Result.ok({ mensaje: mensajeGenerico });
    }

    // RF-SA-H2: Límite de solicitudes de recuperación (rate limiting de 3 solicitudes / 15 min por usuario)
    const ventanaMinutos = 15;
    const desde = new Date(Date.now() - ventanaMinutos * 60 * 1000);
    const solicitudesRecientes =
      await this.passwordResetRepository.contarSolicitudesRecientesPorUsuario(usuario.id, desde);

    if (solicitudesRecientes >= 3) {
      return Result.fail(new LimiteSolicitudesRecuperacionExcedidoError());
    }

    // RF-SA-H3 / RF-SA-H4: Generación de token criptográfico unívoco con expiración de 30 minutos
    const rawToken = crypto.randomUUID();
    const expiraEnMinutos = 30;
    const expiraEn = new Date(Date.now() + expiraEnMinutos * 60 * 1000);

    await this.passwordResetRepository.guardar(usuario.id, rawToken, expiraEn);

    // Envío del enlace seguro por correo
    await this.mailer.enviarEmailRecuperacionPassword({
      para: usuario.email,
      token: rawToken,
      expiraEnMinutos,
    });

    // Auditoría
    await this.auditor.registrar({
      actor: {
        usuarioId: usuario.id,
        ip: request.ip ?? null,
      },
      accion: ACCIONES_AUDITORIA.SOLICITAR_RECUPERACION_PASSWORD,
      entidad: ENTIDADES_AUDITORIA.USUARIOS,
      entidadId: usuario.id,
      detalles: {
        email: usuario.email,
        ventanaMinutos,
      },
    });

    return Result.ok({ mensaje: mensajeGenerico });
  }
}
