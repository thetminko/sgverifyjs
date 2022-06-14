```
import SgVerifyConnector from 'sgverifyjs';

// proxy is optional
// environment can be 'PROD' or 'TEST' or 'SANDOX'. You should use PROD or TEST in production and staging, it has security features.
// SANDBOX does not have security features, not recommended for production or staging
const sgVerify = new SgVerifyConnector({
  callbackUrl: '',
  client: {
    id: '',
    secret: ''
  },
  environment: 'PROD',
  // base64 encoded public cert that you downloaded from SG Verify Developer Portal
  myInfoPublicCert: '',
  // base64 encoded private key of your SSL cert
  privateKey: '',
  personAttributes: [],
  proxy: {
    protocol: '',
    host: '',
    port: 3333
  }
});

// qrCodeExpiryInSec is optional, default to 1800 seconds (3 minutes)
// qrType is optional, default to dynamic
const url = sgVerify.generateQrCodeUrl({ state: '', qrCodeExpiryInSec: 1800, qrType: 'dynamic' });

// txNo is optional, if never pass in, it will generate one internally
const person = await sgVerify.getPersonaData({ authCode: '', state: '', txNo: '' });
```
