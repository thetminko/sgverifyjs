"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtil = void 0;
const crypto_1 = require("crypto");
class CryptoUtil {
    static signWithRs256(data, privateKey) {
        return CryptoUtil.sign(data, privateKey, 'RSA-SHA256');
    }
    static sign(data, privateKey, algorithm) {
        return crypto_1.default.createSign(algorithm).update(data).sign({ key: privateKey }, 'base64');
    }
    static nonce(bytes = 20) {
        return crypto_1.default.randomBytes(bytes).toString('hex');
    }
}
exports.CryptoUtil = CryptoUtil;
//# sourceMappingURL=CrytoUtil.js.map