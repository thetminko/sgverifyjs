import jose from 'node-jose';
import { SgVerifyOptions } from '../types';
import { ApiUtil, CryptoUtil, QueryStringUtil } from '../util';
import { Logger } from './Logger';

const URL_CONFIG: {
  [key in 'PROD' | 'TEST']: {
    tokenUrl: string;
    personUrl: string;
  };
} = {
  PROD: {
    tokenUrl: 'https://api.myinfo.gov.sg/sgverify/v2/token',
    personUrl: 'https://api.myinfo.gov.sg/sgverify/v2/person'
  },
  TEST: {
    tokenUrl: 'https://test.api.myinfo.gov.sg/sgverify/v2/token',
    personUrl: 'https://test.api.myinfo.gov.sg/sgverify/v2/person'
  }
};

export enum MyInfoPersonAttributes {
  nricFin = 'uinfin',
  partialNricFin = 'partialuinfin',
  name = 'name',
  aliasName = 'aliasname',
  marriedName = 'marriedname',
  gender = 'sex',
  race = 'race',
  dateOfBirth = 'dob',
  residentialStatus = 'residentialstatus',
  nationality = 'nationality',
  birthCountry = 'birthcountry',
  passType = 'passtype',
  mobileNumber = 'mobileno',
  email = 'email',
  adddress = 'regadd'
}

export type MyInfoPerson = Readonly<{ [key in keyof typeof MyInfoPersonAttributes]?: string | undefined }>;

export interface MyInfoGetPersonRes {
  data: MyInfoPerson;
  state: string;
}

/**
 * Person Data from SG Verify
 */
type MyInfoPersonData = Readonly<{ [key in MyInfoPersonAttributes]?: string }>;

interface DecodedAccessToken {
  sub: string;
}

interface MyInfoGetTokenRes {
  accessToken: string;
  decodedAccessToken: DecodedAccessToken;
}

export interface MyInfoGetPersonReq {
  /**
   * Authorization Code sent to our callback URL from SG Verify
   */
  authCode: string;

  /**
   * Same state as above
   */
  state: string;

  /**
   * Transaction ID (Optional)
   * Used for tracking
   */
  txNo: string;
}

export class MyInfo {
  private readonly logger?: Logger;

  private readonly options: SgVerifyOptions;

  private readonly default = {
    signatureMethod: 'RS256'
  };

  private readonly env: 'PROD' | 'TEST';

  constructor(options: SgVerifyOptions, logger?: Logger) {
    this.logger = logger;
    this.env = options.isProduction ? 'PROD' : 'TEST';
    this.options = options;
  }

  private sortJSON<T>(json: T): T {
    const keys = Object.keys(json);
    keys.sort();

    const newJSON = {};
    for (const key of keys) {
      newJSON[key] = json[key];
    }

    return newJSON as T;
  }

  private generateAuthorizationHeader(
    url: string,
    params: Record<string, string>,
    method: 'GET' | 'POST',
    contentType?: string
  ): string {
    const nonce = CryptoUtil.nonce();
    const timestamp = new Date().getTime();
    const signatureMethod = this.default.signatureMethod;

    // A) Construct the Authorisation Token
    const defaultAuthHeaders = {
      app_id: this.options.client.id,
      signature_method: signatureMethod,
      nonce,
      timestamp
    };

    if (method === 'POST' && contentType !== 'application/x-www-form-urlencoded') {
      params = {};
    }

    // B) Forming the Signature Base String
    // i) Normalize request parameters
    const baseParams = this.sortJSON({ ...defaultAuthHeaders, ...params });
    const baseParamsStr = QueryStringUtil.stringify(baseParams);

    // Ii) construct request URL ---> url is passed in to this function
    // iii) concatenate request element
    const baseString = `${method}&${url}&${baseParamsStr}`;

    // C) Signing Base String to get Digital Signature
    const signature = CryptoUtil.signWithRs256(baseString, this.options.privateKey);

    // D) Assembling the Header
    return [
      `"PKI_SIGN timestamp"="${timestamp}"`,
      `"nonce"="${nonce}"`,
      `"signature_method"="${signatureMethod}"`,
      `"signature"="${signature}"`
    ].join(',');
  }

  /**
   *
   * This method takes in a JSON Web Signature and will check against
   * the public key for its validity and to retrieve the decoded data.
   * This verification is required for the decoding of the access token and
   * response from Person API
   *
   * @param jws
   * @returns
   */
  private async verifyJws<T>(jws: string): Promise<T> {
    const keystore = jose.JWK.createKeyStore();
    const jwsKey = await keystore.add(this.options.myInfoPublicCert, 'pem');
    const { payload } = await jose.JWS.createVerify(jwsKey).verify(jws);
    return JSON.parse(Buffer.from(payload).toString());
  }

  private async decryptJwe<T>(jwe: string): Promise<T> {
    const keystore = jose.JWK.createKeyStore();
    const jweParts = jwe.split('.');
    if (jweParts.length !== 5) {
      throw new Error('Invalid JWE');
    }

    const key = await keystore.add(this.options.privateKey, 'pem');

    const { payload } = await jose.JWE.createDecrypt(key).decrypt(jwe);
    return this.verifyJws<T>(payload.toString());
  }

  private async getToken(authCode: string, state: string): Promise<MyInfoGetTokenRes> {
    const method = 'POST';
    const url = URL_CONFIG[this.env].tokenUrl;

    const body = {
      grant_type: 'authorization_code',
      code: authCode,
      redirect_uri: this.options.callbackUrl,
      client_id: this.options.client.id,
      client_secret: this.options.client.secret,
      state
    };

    const contentType = 'application/x-www-form-urlencoded';
    const authHeader = this.generateAuthorizationHeader(url, body, method, contentType);

    const headers = {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Cache-Control': 'no-cache',
      Authorization: authHeader
    };

    const data = await ApiUtil.post<{ access_token: string }>(url, body, {
      headers,
      proxy: this.options.proxy
    });

    const decodedAccessToken: DecodedAccessToken = await this.verifyJws<DecodedAccessToken>(data.access_token);

    return {
      accessToken: data.access_token,
      decodedAccessToken
    };
  }

  private parsePersonDataFromRes(data: MyInfoPersonData): MyInfoPerson {
    const person: MyInfoPerson = {};

    for (const key in data) {
      if (!data[key]) {
        continue;
      }

      const personKey =
        Object.keys(MyInfoPersonAttributes)[
          Object.values(MyInfoPersonAttributes).indexOf(key as MyInfoPersonAttributes)
        ];
      if (personKey) {
        person[personKey] = data[key];
      }
    }

    return person;
  }

  async getPersonData(req: MyInfoGetPersonReq): Promise<MyInfoGetPersonRes> {
    this.logger?.info(`Retrieving person data for [${req.state}] [${req.txNo}]`);
    try {
      this.logger?.info(`Retrieving token for [${req.state}] [${req.txNo}]`);
      const {
        accessToken,
        decodedAccessToken: { sub: nricFin }
      } = await this.getToken(req.authCode, req.state);

      this.logger?.info(`Retrieved token for [${req.state}] [${req.txNo}]`);

      this.logger?.info(`Calling Person API for [${req.state}] [${req.txNo}]`);
      const method = 'GET';
      const params = {
        client_id: this.options.client.id,
        attributes: this.options.personAttributes.join(','),
        txNo: req.txNo
      };

      const url = `${URL_CONFIG[this.env].personUrl}/${nricFin}?${QueryStringUtil.stringify(params)}`;

      const authHeaders = this.generateAuthorizationHeader(url, params, method);
      const headers = {
        'Cache-Control': 'no-cache',
        Authorization: `${authHeaders},Bearer ${accessToken}`
      };

      const data = await ApiUtil.get<string>(url, {
        headers,
        proxy: this.options.proxy
      });

      this.logger?.info(`Retrieved person data for [${req.state}] [${req.txNo}]`);

      const myInfoPerson: MyInfoPerson = this.parsePersonDataFromRes(await this.decryptJwe<MyInfoPersonData>(data));

      return {
        data: myInfoPerson,
        state: req.state
      };
    } catch (err) {
      this.logger?.error(`Unable to retrieve person data for state [${req.state}] [${req.txNo}]: [${err.message}]`);
      throw err;
    }
  }
}
