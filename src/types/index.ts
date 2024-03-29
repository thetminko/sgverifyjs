import { Logger } from '../lib/Logger';
import { MyInfoPersonData, MyInfoPersonReq, MyInfoPersonRes, MyInfoPersonAttributes } from '../lib/MyInfo';
import { SgVerifyGenerateQrCodeReq, SgVerifyGenerateQrCodeRes } from '../lib/SgVerify';
import { ProxyConfig } from '../util';

export type SgVerifyEnvironment = 'PROD' | 'TEST' | 'SANDBOX';

export type {
  SgVerifyGenerateQrCodeReq,
  SgVerifyGenerateQrCodeRes,
  MyInfoPersonData,
  MyInfoPersonReq,
  MyInfoPersonRes
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
   * The public cert that you get from SG Verify portal to verify the decrypted payload
   * In utf-8 format string
   */
  myInfoPublicCert: string;

  /**
   * Private Key to encrypt the request to SG Verify.
   * In utf-8 format string
   */
  privateKey: string;

  /**
   * PROD and TEST are for PRODUCTION and STAGING environment respectively.
   * These environments contain all necessary security features.
   *
   * SANDBOX is for testing during development.
   * This environment does not contain security features. You should'nt use this for production and staging.
   */
  environment: SgVerifyEnvironment;

  /**
   * Proxy
   */
  proxy?: ProxyConfig;

  /**
   * Setup attributes to retrieve from person data, you can override this value using the request parameter in getPersonData function
   * Must be the same as what you requested during onboarding to SgVerify else Bear token check failed error will trigger
   */
  personAttributes: MyInfoPersonAttributes[];

  /**
   * Logger to print logs (optional)
   */
  logger?: Logger;
}
