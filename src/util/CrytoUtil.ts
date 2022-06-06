import crypto from 'crypto';

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

  static nonce(bytes = 20) {
    return crypto.randomBytes(bytes).toString('hex');
  }
}
