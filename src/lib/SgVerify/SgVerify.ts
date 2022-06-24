import { SgVerifyOptions } from '../../types';
import { SecurityUtil } from '../../util';
import { DEFAULT_CONFIG, URL_CONFIG } from './Constant';
import { SgVerifyGenerateQrCodeReq, SgVerifyGenerateQrCodeRes } from './Types';

export class SgVerify {
  private readonly options: SgVerifyOptions;

  constructor(options: SgVerifyOptions) {
    this.options = options;
  }

  /**
   * If you change the signing function, remember to change the signatureMethod
   *
   * @param url Url to sign
   * @returns {string} signed url
   */
  private signUrl(url: string): string {
    this.options.logger?.info(`Signing URL [${url}]`);
    return `${url}&signature=${SecurityUtil.signWithRs256(url, this.options.privateKey)}`;
  }

  async generateQrCodeUrl(req: SgVerifyGenerateQrCodeReq): Promise<SgVerifyGenerateQrCodeRes> {
    this.options.logger?.info(`Generating QR Code [${JSON.stringify(req)}]`);
    const { state, qrCodeExpiryInSec, qrType } = req;

    const {
      callbackUrl,
      client: { id: clientId }
    } = this.options;

    const config = URL_CONFIG[this.options.environment];

    const now = new Date();
    const expiry = new Date();
    expiry.setSeconds(now.getSeconds() + (qrCodeExpiryInSec ?? DEFAULT_CONFIG.qrCodeExpiryInSec));

    const { qrType: defaultQrType, version } = DEFAULT_CONFIG;

    const url = [
      config.qrCodeUrl,
      `?callback=${encodeURIComponent(callbackUrl)}`,
      `&client_id=${clientId}`,
      `&nonce=${await SecurityUtil.nonce()}`,
      `&qr_type=${qrType ?? defaultQrType}`,
      `&signature_method=${DEFAULT_CONFIG.signatureMethod}`,
      `&state=${state}`,
      `&timestamp_expiry=${expiry.getTime()}`,
      `&timestamp_start=${now.getTime()}`,
      `&v=${version}`
    ].join('');

    return this.signUrl(url);
  }
}
