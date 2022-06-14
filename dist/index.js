"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
const MyInfo_1 = require("./lib/MyInfo");
const SgVerify_1 = require("./lib/SgVerify");
const util_1 = require("./util");
__exportStar(require("./types"), exports);
class SgVerifyConnector {
    constructor(options) {
        this.sgVerify = new SgVerify_1.SgVerify(options);
        this.myInfo = new MyInfo_1.MyInfo(options);
    }
    generateQrCodeUrl(req) {
        return this.sgVerify.generateQrCodeUrl(req);
    }
    async getPersonaData(req) {
        const txNo = req.txNo ?? util_1.CryptoUtil.nonce(10);
        req.txNo = txNo;
        return this.myInfo.getPersonData(req);
    }
}
exports.default = SgVerifyConnector;
//# sourceMappingURL=index.js.map