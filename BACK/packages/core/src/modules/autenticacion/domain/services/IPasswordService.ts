export interface IPasswordService {
  comparar(plain: string, hash: string): Promise<boolean>;
  hashear(plain: string): Promise<string>;
}
