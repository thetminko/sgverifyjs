import { CryptoUtil } from 'src/util';
import { SgVerifyOptions } from '../types';

export interface SgVerifyGenerateQrCodeReq {
  state: string;
  qrCodeExpiryInSec: number;
  qrType: 'static' | 'dynamic';
}

export type SgVerifyGenerateQrCodeRes = string;

const URL_CONFIG: {
  [key in 'PROD' | 'TEST']: {
    qrCodeUrl: string;
  };
} = {
  PROD: {
    qrCodeUrl: 'https://app.singpass.gov.sg/sgverify'
  },
  TEST: {
    qrCodeUrl: 'https://app.singpass.gov.sg/sgverify'
  }
};

export class SgVerify {
  private readonly options: SgVerifyOptions;

  private readonly default = {
    version: '2',
    qrCodeExpiryInSec: 180, // 3 mins
    qrType: 'dynamic',
    signatureMethod: 'RS256'
  };

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
    return `${url}&signature=${CryptoUtil.signWithRs256(url, this.options.privateKey)}`;
  }

  generateQrCodeUrl(req: SgVerifyGenerateQrCodeReq): SgVerifyGenerateQrCodeRes {
    const { state, qrCodeExpiryInSec, qrType } = req;

    const {
      callbackUrl,
      client: { id: clientId }
    } = this.options;

    const config = URL_CONFIG[this.options.isProduction ? 'PROD' : 'TEST'];

    const now = new Date();
    const expiry = new Date();
    expiry.setSeconds(now.getSeconds() + qrCodeExpiryInSec);

    const { qrType: defaultQrType, version } = this.default;

    const url = [
      config.qrCodeUrl,
      `?callback=${encodeURIComponent(callbackUrl)}`,
      `&client_id=${clientId}`,
      `&qr_type=${qrType ?? defaultQrType}`,
      `&signature_method=${this.default.signatureMethod}`,
      `&v=${version}`,
      `&nonce=${CryptoUtil.nonce()}`,
      `&state=${state}`,
      `&timestamp_expiry=${now.getTime()}`,
      `&timestamp_start=${expiry.getTime()}`
    ].join('');

    return this.signUrl(url);
  }
}
