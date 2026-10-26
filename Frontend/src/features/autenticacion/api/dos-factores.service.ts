/**
 * dos-factores.service.ts — Gestión del 2FA TOTP de la cuenta autenticada (RF-SA-D12).
 *
 * Se separa de IAuthService (Interface Segregation): el login no necesita estos métodos.
 *  - POST /auth/2fa/configurar  → { secretBase32, otpauthUrl } (aún no activa nada)
 *  - POST /auth/2fa/activar     ← activar2faSchema { secretBase32, codigoTotp }
 *  - POST /auth/2fa/desactivar  ← desactivar2faSchema { password }
 */

import type { Activar2faInput, Desactivar2faInput } from '@warengine/contracts';
import { IHttpClient, apiClient } from '@/lib/api';

export interface Configuracion2FA {
  secretBase32: string;
  otpauthUrl: string;
}

export interface IDosFactoresService {
  configurar(): Promise<Configuracion2FA>;
  activar(input: Activar2faInput): Promise<{ mensaje: string }>;
  desactivar(input: Desactivar2faInput): Promise<{ mensaje: string }>;
}

export class DosFactoresService implements IDosFactoresService {
  constructor(private readonly http: IHttpClient = apiClient) {}

  public configurar(): Promise<Configuracion2FA> {
    return this.http.post<Configuracion2FA>('/auth/2fa/configurar');
  }

  public activar(input: Activar2faInput): Promise<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>('/auth/2fa/activar', input);
  }

  public desactivar(input: Desactivar2faInput): Promise<{ mensaje: string }> {
    return this.http.post<{ mensaje: string }>('/auth/2fa/desactivar', input);
  }
}

export const dosFactoresService = new DosFactoresService();
