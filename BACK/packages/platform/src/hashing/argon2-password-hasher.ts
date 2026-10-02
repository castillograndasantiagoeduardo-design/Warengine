import * as argon2 from 'argon2';
import { IPasswordService } from '@warengine/core';

export class Argon2PasswordHasher implements IPasswordService {
  public async hashear(plain: string): Promise<string> {
    return await argon2.hash(plain);
  }

  public async comparar(plain: string, hash: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch (_e) {
      return false;
    }
  }
}
