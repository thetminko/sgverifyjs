"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.MyInfo = exports.MyInfoPersonAttributes = void 0;
const node_jose_1 = require("node-jose");
const util_1 = require("../util");
const URL_CONFIG = {
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
var MyInfoPersonAttributes;
(function (MyInfoPersonAttributes) {
    MyInfoPersonAttributes["nricFin"] = "uinfin";
    MyInfoPersonAttributes["partialNricFin"] = "partialuinfin";
    MyInfoPersonAttributes["name"] = "name";
    MyInfoPersonAttributes["aliasName"] = "aliasname";
    MyInfoPersonAttributes["marriedName"] = "marriedname";
    MyInfoPersonAttributes["gender"] = "sex";
    MyInfoPersonAttributes["race"] = "race";
    MyInfoPersonAttributes["dateOfBirth"] = "dob";
    MyInfoPersonAttributes["residentialStatus"] = "residentialstatus";
    MyInfoPersonAttributes["nationality"] = "nationality";
    MyInfoPersonAttributes["birthCountry"] = "birthcountry";
    MyInfoPersonAttributes["passType"] = "passtype";
    MyInfoPersonAttributes["mobileNumber"] = "mobileno";
    MyInfoPersonAttributes["email"] = "email";
    MyInfoPersonAttributes["adddress"] = "regadd";
})(MyInfoPersonAttributes = exports.MyInfoPersonAttributes || (exports.MyInfoPersonAttributes = {}));
class MyInfo {
    constructor(options) {
        this.default = {
            signatureMethod: 'RS256'
        };
        this.requireSecurityFeatures = true;
        this.options = options;
        this.requireSecurityFeatures = options.environment === 'PROD' || options.environment === 'TEST';
    }
    sortJSON(json) {
        const keys = Object.keys(json);
        keys.sort();
        const newJSON = {};
        for (const key of keys) {
            newJSON[key] = json[key];
        }
        return newJSON;
    }
    generateAuthorizationHeader(url, params, method, contentType) {
        const nonce = util_1.CryptoUtil.nonce();
        const timestamp = new Date().getTime();
        const signatureMethod = this.default.signatureMethod;
        const defaultAuthHeaders = {
            app_id: this.options.client.id,
            signature_method: signatureMethod,
            nonce,
            timestamp
        };
        if (method === 'POST' && contentType !== 'application/x-www-form-urlencoded') {
            params = {};
        }
        const baseParams = this.sortJSON({ ...defaultAuthHeaders, ...params });
        const baseParamsStr = util_1.QueryStringUtil.stringify(baseParams);
        const baseString = `${method}&${url}&${baseParamsStr}`;
        const signature = util_1.CryptoUtil.signWithRs256(baseString, this.options.privateKey);
        return [
            `"PKI_SIGN timestamp"="${timestamp}"`,
            `"nonce"="${nonce}"`,
            `"signature_method"="${signatureMethod}"`,
            `"signature"="${signature}"`
        ].join(',');
    }
    async verifyJws(jws) {
        const keystore = node_jose_1.default.JWK.createKeyStore();
        const jwsKey = await keystore.add(this.options.myInfoPublicCert, 'pem');
        const { payload } = await node_jose_1.default.JWS.createVerify(jwsKey).verify(jws);
        return JSON.parse(Buffer.from(payload).toString());
    }
    async decryptJwe(jwe) {
        const keystore = node_jose_1.default.JWK.createKeyStore();
        const jweParts = jwe.split('.');
        if (jweParts.length !== 5) {
            throw new Error('Invalid JWE');
        }
        const key = await keystore.add(this.options.privateKey, 'pem');
        const { payload } = await node_jose_1.default.JWE.createDecrypt(key).decrypt(jwe);
        return this.verifyJws(payload.toString());
    }
    async getToken(authCode, state) {
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
        const headers = {
            'Content-Type': 'application/x-www-form-urlencoded',
            'Cache-Control': 'no-cache'
        };
        if (this.requireSecurityFeatures) {
            headers.Authorization = this.generateAuthorizationHeader(url, body, method, contentType);
        }
        const data = await util_1.ApiUtil.post(url, body, {
            headers,
            proxy: this.options.proxy
        });
        const decodedAccessToken = await this.verifyJws(data.access_token);
        return {
            accessToken: data.access_token,
            decodedAccessToken
        };
    }
    transformPersonData(data) {
        const person = {};
        for (const key in data) {
            if (!data[key]) {
                continue;
            }
            const personKey = Object.keys(MyInfoPersonAttributes)[Object.values(MyInfoPersonAttributes).indexOf(key)];
            if (personKey) {
                person[personKey] = data[key];
            }
        }
        return person;
    }
    async getPersonData(req) {
        try {
            const { accessToken, decodedAccessToken: { sub: nricFin } } = await this.getToken(req.authCode, req.state);
            const method = 'GET';
            const params = {
                client_id: this.options.client.id,
                attributes: this.options.personAttributes.join(','),
                txNo: req.txNo ?? util_1.CryptoUtil.nonce(10)
            };
            const url = `${URL_CONFIG[this.options.environment].personUrl}/${nricFin}?${util_1.QueryStringUtil.stringify(params)}`;
            const headers = {
                'Cache-Control': 'no-cache'
            };
            if (this.requireSecurityFeatures) {
                headers.Authorization = `${this.generateAuthorizationHeader(url, params, method)},Bearer ${accessToken}`;
            }
            const data = await util_1.ApiUtil.get(url, {
                headers,
                proxy: this.options.proxy
            });
            let jsonData;
            if (this.requireSecurityFeatures) {
                jsonData = await this.decryptJwe(data);
            }
            else {
                jsonData = JSON.parse(data);
            }
            return {
                data: this.transformPersonData(jsonData),
                state: req.state
            };
        }
        catch (err) {
            throw err;
        }
    }
}
exports.MyInfo = MyInfo;
//# sourceMappingURL=MyInfo.js.map