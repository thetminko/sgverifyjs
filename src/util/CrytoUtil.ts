import * as crypto from 'crypto';
import { promisify } from 'util';

export class CryptoUtil {
  /**
   * Signature method of algorithm RSA-SHA256 is RS256
   */
  static signWithRs256(data: string, privateKey: string) {
    return CryptoUtil.sign(data, privateKey, 'RSA-SHA256');
  }

  private static sign(data: string, privateKey: string, algorithm: 'RSA-SHA256') {
    return crypto.createSign(algorithm).update(data).sign({ key: privateKey }, 'base64');
  }

  static async nonce(bytes = 20) {
    const promise = promisify(crypto.randomBytes);
    return promise(bytes).then((buf) => buf.toString('hex'));
  }
}
