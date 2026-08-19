import { APIRequestContext, APIResponse } from '@playwright/test';

import { ApiResponse, HttpMethod } from '@core/api/api.types';
import { LogFormatter } from '@core/logger/log-formatter';
import { AttachmentLogger } from '@core/logger/logger.types';

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseURL: string,
    private readonly logger: AttachmentLogger,
  ) {}

  get<TResponse>(path: string): Promise<ApiResponse<TResponse>> {
    return this.send<undefined, TResponse>(HttpMethod.GET, path, undefined);
  }

  post<TRequest, TResponse>(path: string, body: TRequest): Promise<ApiResponse<TResponse>> {
    return this.send<TRequest, TResponse>(HttpMethod.POST, path, body);
  }

  put<TRequest, TResponse>(path: string, body: TRequest): Promise<ApiResponse<TResponse>> {
    return this.send<TRequest, TResponse>(HttpMethod.PUT, path, body);
  }

  patch<TRequest, TResponse>(path: string, body: TRequest): Promise<ApiResponse<TResponse>> {
    return this.send<TRequest, TResponse>(HttpMethod.PATCH, path, body);
  }

  delete<TResponse>(path: string): Promise<ApiResponse<TResponse>> {
    return this.send<undefined, TResponse>(HttpMethod.DELETE, path, undefined);
  }

  private async send<TRequest, TResponse>(
    method: HttpMethod,
    path: string,
    body: TRequest,
  ): Promise<ApiResponse<TResponse>> {
    const url = `${this.baseURL}${path}`;

    await LogFormatter.attachJson(this.logger, `Request: ${method} ${path}`, {
      timestamp: new Date().toISOString(),
      method,
      url,
      ...(body === undefined ? {} : { body }),
    });

    const response = await this.request.fetch(url, {
      method,
      ...(body === undefined ? {} : { data: body }),
    });

    const status = response.status();
    const parsed = await this.parseBody(response);

    await LogFormatter.attachJson(this.logger, `Response ${status}: ${method} ${path}`, {
      timestamp: new Date().toISOString(),
      status,
      body: parsed,
    });

    return { status, ok: response.ok(), body: parsed as TResponse };
  }

  // Публичный таргет может ответить HTML-страницей от прокси на 429/503.
  // Без этого response.json() бросил бы SyntaxError, потеряв и статус, и тело.
  private async parseBody(response: APIResponse): Promise<unknown> {
    const raw = await response.text();
    if (!raw) return undefined;

    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return raw;
    }
  }
}
