import { APIRequestContext, APIResponse } from '@playwright/test';

import { ApiLogger } from '@core/api/logger';

export class BaseApiClient {
  constructor(
    protected readonly request: APIRequestContext,
    protected readonly baseURL: string,
    private readonly logger: ApiLogger,
  ) {}

  protected async get<TResponse>(path: string, expectedStatus: number): Promise<TResponse> {
    const url = this.url(path);
    this.logger.logRequest('GET', url, {});
    const response = await this.request.get(url);
    return this.handle<TResponse>(response, expectedStatus);
  }

  protected async post<TBody, TResponse>(
    path: string,
    body: TBody,
    expectedStatus: number,
  ): Promise<TResponse> {
    const url = this.url(path);
    this.logger.logRequest('POST', url, {}, body);
    const response = await this.request.post(url, { data: body });
    return this.handle<TResponse>(response, expectedStatus);
  }

  protected async put<TBody, TResponse>(
    path: string,
    body: TBody,
    expectedStatus: number,
  ): Promise<TResponse> {
    const url = this.url(path);
    this.logger.logRequest('PUT', url, {}, body);
    const response = await this.request.put(url, { data: body });
    return this.handle<TResponse>(response, expectedStatus);
  }

  protected async delete(path: string, expectedStatus: number): Promise<void> {
    const url = this.url(path);
    this.logger.logRequest('DELETE', url, {});
    const response = await this.request.delete(url);
    await this.handle(response, expectedStatus);
  }

  private url(path: string): string {
    return `${this.baseURL}${path}`;
  }

  private async handle<TResponse>(
    response: APIResponse,
    expectedStatus: number,
  ): Promise<TResponse> {
    const status = response.status();
    const body = (await response.json()) as unknown;
    this.logger.logResponse(status, body);

    if (status !== expectedStatus) {
      throw new Error(
        `Expected status ${expectedStatus}, but got ${status}\n\nRecent API logs:\n${this.logger.getRecentLogs()}`,
      );
    }

    return body as TResponse;
  }
}
