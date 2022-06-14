import { SgVerifyOptions } from '../types';
export interface SgVerifyGenerateQrCodeReq {
    state: string;
    qrType?: 'static' | 'dynamic';
    qrCodeExpiryInSec?: number;
}
export declare type SgVerifyGenerateQrCodeRes = string;
export declare class SgVerify {
    private readonly options;
    private readonly default;
    constructor(options: SgVerifyOptions);
    private signUrl;
    generateQrCodeUrl(req: SgVerifyGenerateQrCodeReq): Promise<SgVerifyGenerateQrCodeRes>;
}
