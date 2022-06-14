import { SgVerifyEnvironment, SgVerifyOptions } from '../types';
import { CryptoUtil } from '../util';

export interface SgVerifyGenerateQrCodeReq {
  state: string;
  qrType?: 'static' | 'dynamic';
  qrCodeExpiryInSec?: number;
}

export type SgVerifyGenerateQrCodeRes = string;

const URL_CONFIG: {
  [key in SgVerifyEnvironment]: {
    qrCodeUrl: string;
  };
} = {
  PROD: {
    qrCodeUrl: 'https://app.singpass.gov.sg/sgverify'
  },
  TEST: {
    qrCodeUrl: 'https://app.singpass.gov.sg/sgverify'
  },
  SANDBOX: {
    qrCodeUrl: 'https://app.singpass.sg/sgverify'
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

  async generateQrCodeUrl(req: SgVerifyGenerateQrCodeReq): Promise<SgVerifyGenerateQrCodeRes> {
    const { state, qrCodeExpiryInSec, qrType } = req;

    const {
      callbackUrl,
      client: { id: clientId }
    } = this.options;

    const config = URL_CONFIG[this.options.environment];

    const now = new Date();
    const expiry = new Date();
    expiry.setSeconds(now.getSeconds() + (qrCodeExpiryInSec ?? this.default.qrCodeExpiryInSec));

    const { qrType: defaultQrType, version } = this.default;

    const url = [
      config.qrCodeUrl,
      `?callback=${encodeURIComponent(callbackUrl)}`,
      `&client_id=${clientId}`,
      `&nonce=${await CryptoUtil.nonce()}`,
      `&qr_type=${qrType ?? defaultQrType}`,
      `&signature_method=${this.default.signatureMethod}`,
      `&state=${state}`,
      `&timestamp_expiry=${now.getTime()}`,
      `&timestamp_start=${expiry.getTime()}`,
      `&v=${version}`
    ].join('');

    return this.signUrl(url);
  }
}
