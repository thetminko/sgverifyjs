import { SgVerifyOptions, SgVerifyGenerateQrCodeReq, MyInfoGetPersonReq, MyInfoGetPersonRes } from './types';
export * from './types';
export default class SgVerifyConnector {
    private readonly sgVerify;
    private readonly myInfo;
    constructor(options: SgVerifyOptions);
    generateQrCodeUrl(req: SgVerifyGenerateQrCodeReq): Promise<string>;
    getPersonData(req: MyInfoGetPersonReq): Promise<MyInfoGetPersonRes>;
}
