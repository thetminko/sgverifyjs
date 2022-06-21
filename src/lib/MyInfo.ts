import * as jose from 'node-jose';
import { SgVerifyEnvironment, SgVerifyOptions } from '../types';
import { ApiUtil, CryptoUtil, QueryStringUtil } from '../util';

const URL_CONFIG: {
  [key in SgVerifyEnvironment]: {
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
  },
  SANDBOX: {
    tokenUrl: 'https://sandbox.api.myinfo.gov.sg/sgverify/v2/token',
    personUrl: 'https://sandbox.api.myinfo.gov.sg/sgverify/v2/person'
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
  txNo?: string;

  /**
   * Any error returned from callback
   */
  error?: string;

  /**
   * Error description if there is any error from callback
   */
  errorDescription?: string;
}

export class MyInfo {
  private readonly options: SgVerifyOptions;

  private readonly default = {
    signatureMethod: 'RS256'
  };

  private readonly requireSecurityFeatures: boolean = true;

  constructor(options: SgVerifyOptions) {
    this.options = options;
    this.requireSecurityFeatures = options.environment === 'PROD' || options.environment === 'TEST';
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

  private async generateAuthorizationHeader(
    url: string,
    params: Record<string, string>,
    method: 'GET' | 'POST',
    contentType?: string
  ): Promise<string> {
    const nonce = await CryptoUtil.nonce();
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
    this.options.logger?.info('Verifying JWS');

    const keystore = jose.JWK.createKeyStore();
    const jwsKey = await keystore.add(this.options.myInfoPublicCert, 'pem');
    const { payload } = await jose.JWS.createVerify(jwsKey).verify(jws);

    this.options.logger?.info('Verified JWS');
    return JSON.parse(Buffer.from(payload).toString());
  }

  private async decryptJwe<T>(jwe: string): Promise<T> {
    this.options.logger?.info('Decrypting JWE');
    const keystore = jose.JWK.createKeyStore();
    const jweParts = jwe.split('.');
    if (jweParts.length !== 5) {
      throw new Error('Invalid JWE');
    }

    const key = await keystore.add(this.options.privateKey, 'pem');

    const { payload } = await jose.JWE.createDecrypt(key).decrypt(jwe);
    this.options.logger?.info('Decrypted JWE');

    return this.verifyJws<T>(payload.toString());
  }

  private async getToken(authCode: string, state: string): Promise<MyInfoGetTokenRes> {
    this.options.logger?.info(`Getting token for authCode: ${authCode} and state: ${state}`);

    try {
      const method = 'POST';
      const url = URL_CONFIG[this.options.environment].tokenUrl;

      const body = {
        code: authCode,
        grant_type: 'authorization_code',
        client_secret: this.options.client.secret,
        client_id: this.options.client.id,
        redirect_uri: this.options.callbackUrl,
        state
      };

      const contentType = 'application/x-www-form-urlencoded';

      const headers: {
        'Content-Type': string;
        'Cache-Control': string;
        Authorization?: string;
      } = {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Cache-Control': 'no-cache'
      };

      if (this.requireSecurityFeatures) {
        headers.Authorization = await this.generateAuthorizationHeader(url, body, method, contentType);
      }

      this.options.logger?.info(`Calling token url: ${url}`);
      const data = await ApiUtil.post<{ access_token: string; code?: string; message?: string }>(url, body, {
        headers,
        proxy: this.options.proxy
      });
      this.options.logger?.info(`Token url success`);

      if (data.code) {
        throw new Error(`Error occured while getting token [${data.code}] [${data.message}]`);
      }

      this.options.logger?.info(`Decoding access token`);
      const decodedAccessToken: DecodedAccessToken = await this.verifyJws<DecodedAccessToken>(data.access_token);
      this.options.logger?.info(`Decoded access token`);

      return {
        accessToken: data.access_token,
        decodedAccessToken
      };
    } catch (err) {
      this.options.logger?.error(`Error occured while getting token [${err.message}]`);
      throw err;
    }
  }

  private transformPersonData(data: MyInfoPersonData): MyInfoPerson {
    const person: MyInfoPerson = {};
    this.options.logger?.info(`Transforming data`);

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

    this.options.logger?.info(`Transformed data`);
    return person;
  }

  async getPersonData(req: MyInfoGetPersonReq): Promise<MyInfoGetPersonRes> {
    this.options.logger?.info(`Getting person data [${JSON.stringify(req)}]`);
    try {
      if (req.error) {
        throw new Error(`Error occured in callback [${req.error}] [${req.errorDescription}]`);
      }
      if (!req.authCode) {
        throw new Error('Auth code not found in callback');
      }

      const {
        accessToken,
        decodedAccessToken: { sub: nricFin }
      } = await this.getToken(req.authCode, req.state);

      const method = 'GET';
      const params = {
        txNo: req.txNo ?? (await CryptoUtil.nonce(10)),
        attributes: this.options.personAttributes.join(','),
        client_id: this.options.client.id
      };

      const url = `${URL_CONFIG[this.options.environment].personUrl}/${nricFin}?${QueryStringUtil.stringify(params)}`;

      const headers: {
        'Cache-Control': string;
        Authorization?: string;
      } = {
        'Cache-Control': 'no-cache'
      };

      if (this.requireSecurityFeatures) {
        headers.Authorization = `${await this.generateAuthorizationHeader(url, params, method)},Bearer ${accessToken}`;
      }

      this.options.logger?.info(`Calling person url: ${url}`);

      const data = await ApiUtil.get<string | { code: string; message: string }>(url, {
        headers,
        proxy: this.options.proxy
      });

      this.options.logger?.info(`Person url success`);

      if (typeof data === 'string') {
        let jsonData: MyInfoPersonData;
        if (this.requireSecurityFeatures) {
          jsonData = await this.decryptJwe<MyInfoPerson>(data);
        } else {
          jsonData = JSON.parse(data);
        }

        return {
          data: this.transformPersonData(jsonData),
          state: req.state
        };
      }

      throw new Error(`Error occured while getting person data [${data.code}] [${data.message}]`);
    } catch (err) {
      throw err;
    }
  }
}
