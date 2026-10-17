export interface EnviarEmailRecuperacionDto {
  para: string;
  token: string;
  expiraEnMinutos: number;
}

export interface IMailer {
  enviarEmailRecuperacionPassword(dto: EnviarEmailRecuperacionDto): Promise<void>;
}
