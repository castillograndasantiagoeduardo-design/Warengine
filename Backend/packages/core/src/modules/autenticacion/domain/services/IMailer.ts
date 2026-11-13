export interface EnviarEmailRecuperacionDto {
  para: string;
  token: string;
  expiraEnMinutos: number;
}

export interface EnviarEmailOtpDto {
  para: string;
  codigoOtp: string;
  expiraEnMinutos: number;
}

export interface IOtpMailer {
  enviarCodigoOtp(dto: EnviarEmailOtpDto): Promise<void>;
}

export interface IMailer {
  enviarEmailRecuperacionPassword(dto: EnviarEmailRecuperacionDto): Promise<void>;
}
