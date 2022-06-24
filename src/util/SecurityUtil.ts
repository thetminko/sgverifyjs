import crypto from 'crypto';
import { promisify } from 'util';
import jose from 'node-jose';

export class SecurityUtil {
  /**
   * Signature method of algorithm RSA-SHA256 is RS256
   */
  static signWithRs256(data: string, privateKey: string) {
    return SecurityUtil.sign(data, privateKey, 'RSA-SHA256');
  }

  private static sign(data: string, privateKey: string, algorithm: 'RSA-SHA256') {
    return crypto.createSign(algorithm).update(data).sign({ key: privateKey }, 'base64');
  }

  static async nonce(bytes = 20) {
    const promise = promisify(crypto.randomBytes);
    return promise(bytes).then((buf) => buf.toString('hex'));
  }

  static async verifyJws<T>(jws: string, publicCert: string): Promise<T> {
    const keystore = jose.JWK.createKeyStore();
    const jwsKey = await keystore.add(publicCert, 'pem');
    const { payload } = await jose.JWS.createVerify(jwsKey).verify(jws);
    return JSON.parse(Buffer.from(payload).toString());
  }

  static async decryptJwe<T>(jwe: string, publicCert: string, privateKey: string): Promise<T> {
    const keystore = jose.JWK.createKeyStore();
    const jweParts = jwe.split('.');
    if (jweParts.length !== 5) {
      throw new Error('Invalid JWE');
    }

    const key = await keystore.add(privateKey, 'pem');

    const { payload } = await jose.JWE.createDecrypt(key).decrypt(jwe);
    return SecurityUtil.verifyJws<T>(JSON.parse(payload.toString()), publicCert);
  }
}
