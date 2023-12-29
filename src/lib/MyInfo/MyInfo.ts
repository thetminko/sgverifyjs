import { MyInfoPersonData, MyInfoPersonReq, MyInfoPersonRes, SgVerifyOptions } from '../../types';
import { ApiUtil, SecurityUtil, QueryStringUtil, SortUtil } from '../../util';
import { DEFAULT_CONFIG, URL_CONFIG } from './Constant';
import { MyInfoPerson } from './MyInfoPerson';
import { DecodedAccessToken, MyInfoPersonApiResData, MyInfoTokenApiRes } from './Types';

export class MyInfo {
  private readonly options: SgVerifyOptions;

  private readonly requireSecurityFeatures: boolean = true;

  constructor(options: SgVerifyOptions) {
    this.options = options;
    this.requireSecurityFeatures = options.environment === 'PROD' || options.environment === 'TEST';
  }

  private async generateAuthorizationHeader(
    url: string,
    params: Record<string, string>,
    method: 'GET' | 'POST',
    contentType?: string
  ): Promise<string> {
    const nonce = await SecurityUtil.nonce();
    const timestamp = new Date().getTime();
    const signatureMethod = DEFAULT_CONFIG.signatureMethod;

    // A) Construct the Authorisation Token
    const defaultAuthHeaders = {
      app_id: this.options.client.id,
      nonce,
      signature_method: signatureMethod,
      timestamp
    };

    if (method === 'POST' && contentType !== 'application/x-www-form-urlencoded') {
      params = {};
    }

    // B) Forming the Signature Base String
    // i) Normalize request parameters
    const baseParams = SortUtil.sortJSON({ ...defaultAuthHeaders, ...params });
    const baseParamsStr = QueryStringUtil.stringify(baseParams, { encode: false });

    // Ii) construct request URL ---> url is passed in to this function
    // iii) concatenate request element
    const baseString = `${method}&${url}&${baseParamsStr}`;
    this.options.logger?.debug(`Base token string [${baseString}]`);

    // C) Signing Base String to get Digital Signature
    const signature = SecurityUtil.signWithRs256(baseString, this.options.privateKey);
    this.options.logger?.debug(`Signature [${signature}]`);

    // D) Assembling the Header
    return [
      `PKI_SIGN timestamp="${timestamp}"`,
      `nonce="${nonce}"`,
      `app_id="${this.options.client.id}"`,
      `signature_method="${signatureMethod}"`,
      `signature="${signature}"`
    ].join(',');
  }

  private async getToken(authCode: string, state: string): Promise<MyInfoTokenApiRes> {
    this.options.logger?.info(`Getting token for authCode: ${authCode} and state: ${state}`);

    try {
      const method = 'POST';
      const url = URL_CONFIG[this.options.environment].tokenUrl;

      const body = {
        grant_type: 'authorization_code',
        code: authCode,
        redirect_uri: this.options.callbackUrl,
        client_id: this.options.client.id,
        client_secret: this.options.client.secret,
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

      const reqBody = QueryStringUtil.stringify(body, { sort: false });
      const data = await ApiUtil.post<{ access_token: string; code?: string; message?: string }>(url, reqBody, {
        headers,
        proxy: this.options.proxy,
        responseType: 'json'
      });

      this.options.logger?.debug(`Token url success`);

      if (data.code) {
        throw new Error(`Error occurred while getting token. Response code [${data.code}] [${data.message}]`);
      }

      this.options.logger?.debug(`Decoding access token`);
      const decodedAccessToken: DecodedAccessToken = await SecurityUtil.verifyJws<DecodedAccessToken>(
        data.access_token,
        this.options.myInfoPublicCert
      );
      this.options.logger?.debug(`Decoded access token [${JSON.stringify(decodedAccessToken)}]`);

      return {
        accessToken: data.access_token,
        decodedAccessToken
      };
    } catch (err) {
      this.options.logger?.error(`Error occurred while getting token [${err.message}]`);
      throw err;
    }
  }

  private transformPersonData(data: MyInfoPersonApiResData): MyInfoPersonData {
    this.options.logger?.debug(`Transforming data`);
    const person: MyInfoPersonData = new MyInfoPerson(data).transform();
    this.options.logger?.debug(`Transformed data`);
    return person;
  }

  async getPersonData<TransformedData>(
    req: MyInfoPersonReq<TransformedData>
  ): Promise<MyInfoPersonRes<TransformedData>> {
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
        decodedAccessToken: { sub: id }
      } = await this.getToken(req.authCode, req.state);

      const method = 'GET';
      const params = {
        client_id: this.options.client.id,
        attributes: this.options.personAttributes.join(','),
        txnNo: req.txnNo ?? (await SecurityUtil.nonce(10))
      };

      const headers: {
        'Content-Type': string;
        'Cache-Control': string;
        Authorization?: string;
      } = {
        'Content-Type': 'application/text',
        'Cache-Control': 'no-cache'
      };

      const url = `${URL_CONFIG[this.options.environment].personUrl}/${id}`;

      if (this.requireSecurityFeatures) {
        headers.Authorization = `${await this.generateAuthorizationHeader(url, params, method)},Bearer ${accessToken}`;
      }

      const data = await ApiUtil.get<string | { code: string; message: string }>(
        `${url}?${QueryStringUtil.stringify(params, { encode: false, sort: false })}`,
        {
          headers,
          proxy: this.options.proxy,
          responseType: 'text'
        }
      );

      this.options.logger?.info(`Person url success`);

      if (typeof data === 'string') {
        let jsonData: MyInfoPersonApiResData;
        if (this.requireSecurityFeatures) {
          jsonData = await SecurityUtil.decryptJwe<MyInfoPersonApiResData>(
            data,
            this.options.myInfoPublicCert,
            this.options.privateKey
          );
        } else {
          jsonData = JSON.parse(data);
        }

        return {
          data: req.transform ? req.transform(jsonData) : this.transformPersonData(jsonData),
          state: req.state
        };
      }

      throw new Error(`Error occured while getting person data [${data.code}] [${data.message}]`);
    } catch (err) {
      throw err;
    }
  }
}
