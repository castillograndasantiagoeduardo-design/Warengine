import { ITotpService, GenerarSecretoTotpOutput } from '@warengine/core';

const BASE32_ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function base32Encode(bytes: Uint8Array): string {
  let result = '';
  let bits = 0;
  let value = 0;

  for (let i = 0; i < bytes.length; i++) {
    value = (value << 8) | bytes[i];
    bits += 8;

    while (bits >= 5) {
      result += BASE32_ALPHABET[(value >>> (bits - 5)) & 31];
      bits -= 5;
    }
  }

  if (bits > 0) {
    result += BASE32_ALPHABET[(value << (5 - bits)) & 31];
  }

  return result;
}

function base32Decode(base32: string): Uint8Array {
  const clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s+/g, '');
  let bits = 0;
  let value = 0;
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i++) {
    const val = BASE32_ALPHABET.indexOf(clean[i]);
    if (val === -1) {
      throw new Error(`Carácter Base32 inválido: ${clean[i]}`);
    }
    value = (value << 5) | val;
    bits += 5;

    if (bits >= 8) {
      bytes.push((value >>> (bits - 8)) & 255);
      bits -= 8;
    }
  }

  return new Uint8Array(bytes);
}

export class TotpService implements ITotpService {
  constructor(private readonly defaultIssuer: string = 'Warengine') {}

  public generarSecreto(email: string, issuer = this.defaultIssuer): GenerarSecretoTotpOutput {
    const randomBytes = new Uint8Array(20);
    crypto.getRandomValues(randomBytes);
    const secretBase32 = base32Encode(randomBytes);

    const encodedIssuer = encodeURIComponent(issuer);
    const encodedEmail = encodeURIComponent(email);
    const otpauthUrl = `otpauth://totp/${encodedIssuer}:${encodedEmail}?secret=${secretBase32}&issuer=${encodedIssuer}&algorithm=SHA1&digits=6&period=30`;

    return {
      secretBase32,
      otpauthUrl,
    };
  }

  public async validarCodigo(secretBase32: string, token: string): Promise<boolean> {
    if (!token || !/^\d{6}$/.test(token.trim())) {
      return false;
    }

    let secretBytes: Uint8Array;
    try {
      secretBytes = base32Decode(secretBase32);
    } catch {
      return false;
    }

    const key = await crypto.subtle.importKey(
      'raw',
      secretBytes.buffer as ArrayBuffer,
      { name: 'HMAC', hash: 'SHA-1' },
      false,
      ['sign'],
    );


    const stepSeconds = 30;
    const currentStep = Math.floor(Date.now() / 1000 / stepSeconds);

    // Ventana de tolerancia: paso anterior (-1), paso actual (0), paso siguiente (+1)
    for (let delta = -1; delta <= 1; delta++) {
      const step = currentStep + delta;
      const expectedToken = await this.generarHotp(key, step);
      if (expectedToken === token.trim()) {
        return true;
      }
    }

    return false;
  }

  private async generarHotp(key: CryptoKey, counter: number): Promise<string> {
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);
    // Counter como entero de 64 bits big-endian
    view.setUint32(0, Math.floor(counter / 0x100000000), false);
    view.setUint32(4, counter & 0xffffffff, false);

    const signature = await crypto.subtle.sign('HMAC', key, buffer);
    const hmac = new Uint8Array(signature);

    const offset = hmac[hmac.length - 1] & 0x0f;
    const binary =
      ((hmac[offset] & 0x7f) << 24) |
      ((hmac[offset + 1] & 0xff) << 16) |
      ((hmac[offset + 2] & 0xff) << 8) |
      (hmac[offset + 3] & 0xff);

    const otp = binary % 1000000;
    return otp.toString().padStart(6, '0');
  }
}
