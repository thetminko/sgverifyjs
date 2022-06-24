

# SgVerifyService.ts
```
import fs from 'fs';
import SgVerifyConnector, {
  MyInfoPersonReq,
  MyInfoPersonRes,
  MyInfoPersonAttributes,
  SgVerifyGenerateQrCodeReq,
  SgVerifyGenerateQrCodeRes
} from 'sgverifyjs';

const personAttributes: MyInfoPersonAttributes[] = [
  MyInfoPersonAttributes.partialNricFin,
  MyInfoPersonAttributes.name,
  MyInfoPersonAttributes.aliasName,
  MyInfoPersonAttributes.marriedName,
  MyInfoPersonAttributes.gender,
  MyInfoPersonAttributes.race,
  MyInfoPersonAttributes.dateOfBirth,
  MyInfoPersonAttributes.residentialStatus,
  MyInfoPersonAttributes.nationality,
  MyInfoPersonAttributes.birthCountry,
  MyInfoPersonAttributes.passType,
  MyInfoPersonAttributes.mobileNumber,
  MyInfoPersonAttributes.email,
  MyInfoPersonAttributes.adddress
];

export class SgVerifyService extends SgVerifyConnector {
  private readonly isAvailableForEnv: boolean = false;

  constructor() {
    // ur environment map to SgVerify environment param
    const envMapping = {
      ['prd']: 'PROD',
      ['stg']: 'TEST'
    };

    const environment = envMapping.stg; // ur environment

    super({
      // callback url. AuthCode will be sent to this url and this url must be registered in SgVerify portal
      callbackUrl: 'http://yourdomain.com/api/sg-verify/callback',
      client: {
        id: 'STG-something', // client id from SgVerify portal
        secret: 'sensitive value' // client secret from SgVerify portal
      },
      // sync is ok if u init this service file on app startup else use async read
      myInfoPublicCert: environment && fs.readFileSync('sgverify-public.cer', 'utf-8'),
      privateKey: environment && fs.readFileSync('app-ssl-private.key', 'utf-8'),
      // Must be the same attributes that you requested to SgVerify during onboarding process
      personAttributes,
      environment,
      // only if you have outgoing proxy
      proxy: {
        host: 'http://squid.yourdomain.com',
        port: 3333
      },
      logger: undefined // if you have ur logger
    });

    this.isAvailableForEnv = !!environment;
  }

  // default type is dynamic and expires in 3 minutes
  override async generateQrCodeUrl(req: SgVerifyGenerateQrCodeReq): Promise<SgVerifyGenerateQrCodeRes> {
    return super.generateQrCodeUrl(req);
  }

  async getPersonDataInfo(req: MyInfoPersonReq): Promise<MyInfoPersonRes> {
    return super.getPersonData(req);
  }

  isFeatureAvailable() {
    return this.isAvailableForEnv;
  }
}
```

# Init Services on app start up. (e.g. src/services/index.ts)
```
import { SgVerifyService } from './SgVerifyService';

export const sgVerifyService = new SgVerifyService();
```

# SgVerifyController.ts
```
import { sgVerifyService } from './services';

@Controller('sg-verify')
export class SgVerifyController {

  @Get('qrCode')
  @AutoRespond()
  async generateQrCode(): Promise<SgVerifyGenerateQrCodeRes> {
    return sgVerifyService.generateQrCodeUrl({
      state: StringUtil.generateUuid(),
      qrCodeExpiryInSec: 604800
    });
  }

  @Get('callback')
  @AutoRespond()
  async callback(req: Request) {
    const input: MyInfoPersonReq = {
      authCode: req.query.code as string,
      state: req.query.state as string,
      error: req.query.error as string,
      errorDescription: req.query.error_description as string
    };

    // Not required to await or return response, because the caller is from SgVerify
    // Use websocket or express-sse to push the data back to the front-end client
    sgVerifyService.getPersonDataInfo(input);
  }

}
```