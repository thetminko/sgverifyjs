import { MyInfoPerson, MyInfoGetPersonReq, MyInfoGetPersonRes, MyInfoPersonAttributes } from 'src/lib/MyInfo';
import { SgVerifyGenerateQrCodeReq, SgVerifyGenerateQrCodeRes } from 'src/lib/SgVerify';

export type {
  SgVerifyGenerateQrCodeReq,
  SgVerifyGenerateQrCodeRes,
  MyInfoPerson,
  MyInfoGetPersonReq,
  MyInfoGetPersonRes
};

export { MyInfoPersonAttributes };

export interface SgVerifyOptions {
  /**
   * Call back URL for SG Verify to send the response back with the authorisation code.
   */
  callbackUrl: string;

  /**
   * Unique ID for your application.
   * Client secret given to us in developer portal
   */
  client: {
    id: string;
    secret: string;
  };

  /**
   * The file path of the public cert that you get from SG Verify portal to verify the decrypted payload
   * In utf-8 format string
   */
  myInfoPublicCert: string;

  /**
   * Private Key to encrypt the request to SG Verify.
   * In utf-8 format string
   */
  privateKey: string;

  /**
   * Is for production usage or staging usage
   */
  isProduction: boolean;

  /**
   * Proxy
   */
  proxy?: {
    host: string;
    port: number;
  };

  /**
   * Setup attributes to retrieve from person data, you can override this value using the request parameter in getPersonData function
   */
  personAttributes: MyInfoPersonAttributes[];
}
