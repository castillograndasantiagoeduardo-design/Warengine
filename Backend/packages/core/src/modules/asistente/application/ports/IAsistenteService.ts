import { DomainError, Result } from '@warengine/shared-kernel';

export interface MensajeHistorial {
  rol: 'user' | 'model' | 'assistant';
  texto: string;
}

export interface PeticionAsistenteInput {
  mensaje: string;
  tokenJwt: string;
  usuarioId: string;
  sucursalId?: number | null;
  historial?: MensajeHistorial[];
}

export interface RespuestaAsistenteOutput {
  respuesta: string;
  toolsEjecutadas: string[];
}

/**
 * Puerto para el servicio de inteligencia artificial y orquestación MCP.
 * Desacopla el Core de la implementación concreta (Gemini, OpenAI, Claude).
 */
export interface IAsistenteService {
  procesarMensaje(input: PeticionAsistenteInput): Promise<Result<RespuestaAsistenteOutput, DomainError>>;
}
