```
import SgVerifyConnector from 'sgverifyjs';

const sgVerify = new SgVerifyConnector({
  callbackUrl: '',
  client: {
    id: '',
    secret: ''
  },
  isProduction: false,
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
