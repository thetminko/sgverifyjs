"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CryptoUtil = void 0;
const crypto = require("crypto");
const util_1 = require("util");
class CryptoUtil {
    static signWithRs256(data, privateKey) {
        return CryptoUtil.sign(data, privateKey, 'RSA-SHA256');
    }
    static sign(data, privateKey, algorithm) {
        return crypto.createSign(algorithm).update(data).sign({ key: privateKey }, 'base64');
    }
    static async nonce(bytes = 20) {
        const promise = (0, util_1.promisify)(crypto.randomBytes);
        return promise(bytes).then((buf) => buf.toString('hex'));
    }
}
exports.CryptoUtil = CryptoUtil;
//# sourceMappingURL=CrytoUtil.js.map