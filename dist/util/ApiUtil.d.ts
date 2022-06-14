import { AxiosProxyConfig } from 'axios';
export declare type ProxyConfig = AxiosProxyConfig | false;
export interface FetchOptions {
    proxy?: AxiosProxyConfig | false;
    headers?: Record<string, string>;
    timeout?: number;
}
export declare class ApiUtil {
    static get<T>(uri: string, req?: Record<string, any>, options?: FetchOptions): Promise<T>;
    static post<T>(uri: string, req?: Record<string, any>, options?: FetchOptions): Promise<T>;
    private static fetch;
}
