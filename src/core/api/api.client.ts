import { APIRequestContext, APIResponse } from '@playwright/test';

import { HttpMethod } from '@core/api/api.types';
import { ApiLogger } from '@core/api/logger';

export interface ApiResult<TResponse> {
  status: number;
  body: TResponse;
}

export class BaseApiClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly baseURL: string,
    private readonly logger: ApiLogger,
  ) {}

  protected get<TResponse>(path: string, expectedStatus?: number): Promise<ApiResult<TResponse>> {
    return this.send<undefined, TResponse>(HttpMethod.GET, path, undefined, expectedStatus);
  }

  protected post<TRequest, TResponse>(
    path: string,
    body: TRequest,
    expectedStatus?: number,
  ): Promise<ApiResult<TResponse>> {
    return this.send<TRequest, TResponse>(HttpMethod.POST, path, body, expectedStatus);
  }

  protected put<TRequest, TResponse>(
    path: string,
    body: TRequest,
    expectedStatus?: number,
  ): Promise<ApiResult<TResponse>> {
    return this.send<TRequest, TResponse>(HttpMethod.PUT, path, body, expectedStatus);
  }

  protected delete<TResponse>(path: string, expectedStatus?: number): Promise<ApiResult<TResponse>> {
    return this.send<undefined, TResponse>(HttpMethod.DELETE, path, undefined, expectedStatus);
  }

  private async send<TRequest, TResponse>(
    method: HttpMethod,
    path: string,
    body: TRequest,
    expectedStatus?: number,
  ): Promise<ApiResult<TResponse>> {
    const url = `${this.baseURL}${path}`;
    this.logger.logRequest(method, url, body);

    const response = await this.request.fetch(url, {
      method,
      ...(body === undefined ? {} : { data: body }),
    });

    const status = response.status();
    const parsed = await this.parseBody(response);
    this.logger.logResponse(status, parsed);

    if (expectedStatus !== undefined && status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, but got ${status}\n\nRecent API logs:\n${this.logger.getRecentLogs()}`,
      );
    }

    return { status, body: parsed as TResponse };
  }

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
