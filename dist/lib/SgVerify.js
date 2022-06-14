"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SgVerify = void 0;
const util_1 = require("src/util");
const URL_CONFIG = {
    PROD: {
        qrCodeUrl: 'https://app.singpass.gov.sg/sgverify'
    },
    TEST: {
        qrCodeUrl: 'https://test.app.singpass.gov.sg/sgverify'
    },
    SANDBOX: {
        qrCodeUrl: 'https://sandbox.app.singpass.sg/sgverify'
    }
};
class SgVerify {
    constructor(options) {
        this.default = {
            version: '2',
            qrCodeExpiryInSec: 180,
            qrType: 'dynamic',
            signatureMethod: 'RS256'
        };
        this.options = options;
    }
    signUrl(url) {
        return `${url}&signature=${util_1.CryptoUtil.signWithRs256(url, this.options.privateKey)}`;
    }
    generateQrCodeUrl(req) {
        const { state, qrCodeExpiryInSec, qrType } = req;
        const { callbackUrl, client: { id: clientId } } = this.options;
        const config = URL_CONFIG[this.options.environment];
        const now = new Date();
        const expiry = new Date();
        expiry.setSeconds(now.getSeconds() + qrCodeExpiryInSec);
        const { qrType: defaultQrType, version } = this.default;
        const url = [
            config.qrCodeUrl,
            `?callback=${encodeURIComponent(callbackUrl)}`,
            `&client_id=${clientId}`,
            `&qr_type=${qrType ?? defaultQrType}`,
            `&signature_method=${this.default.signatureMethod}`,
            `&v=${version}`,
            `&nonce=${util_1.CryptoUtil.nonce()}`,
            `&state=${state}`,
            `&timestamp_expiry=${now.getTime()}`,
            `&timestamp_start=${expiry.getTime()}`
        ].join('');
        return this.signUrl(url);
    }
}
exports.SgVerify = SgVerify;
//# sourceMappingURL=SgVerify.js.map