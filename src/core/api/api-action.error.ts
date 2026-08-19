import { ApiResponse } from '@core/api/api.types';
import { LogFormatter } from '@core/logger/log-formatter';

export class ApiActionError<TBody> extends Error {
  constructor(
    action: string,
    expectedStatus: number,
    readonly response: ApiResponse<TBody>,
  ) {
    super(
      `Action "${action}" failed. Expected status ${expectedStatus}, but got ${response.status}.\n` +
        `Response:\n${LogFormatter.format(response.body)}`,
    );
    this.name = 'ApiActionError';
  }
}
