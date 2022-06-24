export interface SgVerifyGenerateQrCodeReq {
  state: string;
  qrType?: 'static' | 'dynamic';
  qrCodeExpiryInSec?: number;
}

export type SgVerifyGenerateQrCodeRes = string;
