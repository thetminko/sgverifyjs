import axios, { AxiosError, AxiosProxyConfig, ResponseType } from 'axios';

export type ProxyConfig = AxiosProxyConfig | false;

export interface FetchOptions {
  /**
   * Proxy
   */
  proxy?: AxiosProxyConfig | false;
  /**
   * Header values
   */
  headers?: Record<string, string>;
  /**
   * Timeout ms
   */
  timeout?: number;

  responseType: ResponseType;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiUtil {
  /**
   * GET.
   *
   * @param uri API uri
   * @param options options
   * @returns response
   */
  static async get<T>(uri: string, options?: FetchOptions) {
    return this.fetch<T>('GET', uri, undefined, options);
  }

  /**
   * POST.
   *
   * @param uri API uri
   * @param req request body
   * @param options options
   * @returns response
   */
  static async post<T>(uri: string, reqBody?: string, options?: FetchOptions) {
    return this.fetch<T>('POST', uri, reqBody, options);
  }

  private static async fetch<T>(method: HttpMethod, uri: string, data?: string, options?: FetchOptions): Promise<T> {
    try {
      const response = await axios(uri, {
        headers: options?.headers,
        proxy: options?.proxy,
        timeout: options?.timeout,
        responseType: options?.responseType ?? 'json',
        method,
        data
      });
      return response.data;
    } catch (err) {
      throw new Error(JSON.stringify((err as unknown as AxiosError).response?.data));
    }
  }
}
