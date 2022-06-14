import { MyInfoPerson, MyInfoGetPersonReq, MyInfoGetPersonRes, MyInfoPersonAttributes } from '../lib/MyInfo';
import { SgVerifyGenerateQrCodeReq, SgVerifyGenerateQrCodeRes } from '../lib/SgVerify';
import { ProxyConfig } from '../util';
export declare type SgVerifyEnvironment = 'PROD' | 'TEST' | 'SANDBOX';
export type { SgVerifyGenerateQrCodeReq, SgVerifyGenerateQrCodeRes, MyInfoPerson, MyInfoGetPersonReq, MyInfoGetPersonRes };
export { MyInfoPersonAttributes };
export interface SgVerifyOptions {
    callbackUrl: string;
    client: {
        id: string;
        secret: string;
    };
    myInfoPublicCert: string;
    privateKey: string;
    environment: SgVerifyEnvironment;
    proxy?: ProxyConfig;
    personAttributes: MyInfoPersonAttributes[];
}
