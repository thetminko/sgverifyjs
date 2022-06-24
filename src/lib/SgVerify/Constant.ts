import { SgVerifyEnvironment } from '../../types';

// QR Code URL is the same for all environments but kept separately in config to change easily if needed
export const URL_CONFIG: {
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

export const DEFAULT_CONFIG = {
  version: '2',
  qrCodeExpiryInSec: 180, // 3 mins
  qrType: 'dynamic',
  signatureMethod: 'RS256'
};
