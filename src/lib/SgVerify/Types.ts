export interface SgVerifyGenerateQrCodeReq {
  state: string;
  qrType?: 'static' | 'dynamic';
  qrCodeExpiryInSec?: number;
}

export type SgVerifyGenerateQrCodeRes = {
  url: string;
  expiryTimestamp: number;
};
