```
import SgVerifyConnector from 'src';

const sgVerify = new SgVerifyConnector({
  callbackUrl: '',
  client: {
    id: '',
    secret: ''
  },
  isProduction: false,
  // base64 encoded public cert
  myInfoPublicCert: '',
  // base64 encoded private key
  privateKey: '',
  personAttributes: [],
  proxy: {
    protocol: '',
    host: '',
    port: 3333
  }
});

const url = sgVerify.generateQrCodeUrl({ state: '', qrCodeExpiryInSec: 1800, qrType: 'dynamic' });
const person = await sgVerify.getPersonaData({ authCode: '', state: '', txNo: '' });
```