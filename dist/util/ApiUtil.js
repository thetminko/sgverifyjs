"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiUtil = void 0;
const axios_1 = require("axios");
class ApiUtil {
    static async get(uri, req, options) {
        return this.fetch('GET', uri, req, options);
    }
    static async post(uri, req, options) {
        return this.fetch('POST', uri, req, options);
    }
    static async fetch(method, uri, req, options) {
        const headers = {
            ['Content-Type']: 'application/json; charset=utf-8',
            ...options?.headers
        };
        try {
            const response = await (0, axios_1.default)(uri, {
                proxy: options?.proxy,
                method,
                headers,
                params: method === 'GET' ? req : undefined,
                data: method !== 'GET' ? req : undefined,
                withCredentials: true,
                responseType: 'json',
                timeout: options?.timeout
            });
            return response.data;
        }
        catch (err) {
            throw err;
        }
    }
}
exports.ApiUtil = ApiUtil;
//# sourceMappingURL=ApiUtil.js.map