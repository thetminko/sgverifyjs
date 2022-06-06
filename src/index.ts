import { Logger } from './lib/Logger';
import { MyInfo } from './lib/MyInfo';
import { SgVerify } from './lib/SgVerify';
import { SgVerifyOptions, SgVerifyGenerateQrCodeReq, MyInfoGetPersonReq, MyInfoGetPersonRes } from './types';
import { CryptoUtil } from './util';

export default class SgVerifyConnector {
  private readonly logger?: Logger;

  private readonly sgVerify: SgVerify;

  private readonly myInfo: MyInfo;

  constructor(options: SgVerifyOptions, logger?: Logger) {
    this.logger = logger;
    this.sgVerify = new SgVerify(options, logger);
    this.myInfo = new MyInfo(options, logger);
  }

  /**
   * To generate QR code URL for SingPass Verify to scan
   *
   * state - Identifier that represents the user's session/transaction with the client for reconciling query and response.
   * The same value will be sent back via the callback URL. Use a unique system generated number for each user/transaction. e.g. USER_ABC
   *
   * qrCodeExpiryInSec -  expiry in seconds, default to 3 mins
   *
   * qrType - static or dynamic
   *
   * Static QR codes are normally used for time-bound/one-off events. They can be printed on paper and distributed, and scanned multiple times.
   * Being static in nature, the QR codes will not work after the stipulated validity.
   *
   * Dynamic QR codes are normally used on digital devices such as tablet or kiosk. The QR codes should not be printed out,
   * and should be displayed on the digital devices.
   * Dynamic QR codes are generated on the fly, short-lived e.g. valid for only 5 minutes after generation, one-time used i.e.
   * invalidated once scanned.
   *
   * @returns string
   */
  generateQrCodeUrl(req: SgVerifyGenerateQrCodeReq): string {
    this.logger?.info(`Generating QR code for [${req.state}]`);
    return this.sgVerify.generateQrCodeUrl(req);
  }

  /**
   * To retrieve the person data after the user has scanned the QR code and authenticated on SingPass
   *
   * @param req SgVerifyGetPersonReq
   * @returns Promise<{ data: SgVerifyPersonData, state: string }>
   */
  async getPersonaData(req: MyInfoGetPersonReq): Promise<MyInfoGetPersonRes> {
    this.logger?.info(`Getting person data for state [${req.state}]`);
    const txNo = req.txNo ?? CryptoUtil.nonce(10);
    req.txNo = txNo;
    return this.myInfo.getPersonData(req);
  }
}
