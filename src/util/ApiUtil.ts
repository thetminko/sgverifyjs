import axios, { AxiosProxyConfig } from 'axios';

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
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export class ApiUtil {
  /**
   * GET.
   *
   * @param uri API uri
   * @param req querystrings
   * @param options options
   * @returns response
   */
  static async get<T>(uri: string, req?: Record<string, any>, options?: FetchOptions) {
    return this.fetch<T>('GET', uri, req, options);
  }

  /**
   * POST.
   *
   * @param uri API uri
   * @param req request body or form data
   * @param options options
   * @returns response
   */
  static async post<T>(uri: string, req?: Record<string, any>, options?: FetchOptions) {
    return this.fetch<T>('POST', uri, req, options);
  }

  private static async fetch<T>(
    method: HttpMethod,
    uri: string,
    req?: Record<string, unknown> | FormData,
    options?: FetchOptions
  ): Promise<T> {
    const headers: any = {
      ['Content-Type']: 'application/json; charset=utf-8',
      ...options?.headers
    };

    try {
      const response = await axios(uri, {
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
    } catch (err) {
      throw err;
    }
  }
}
