import { ApiResponse } from '@core/api/api.types';

export class ApiActionError extends Error {
  constructor(
    action: string,
    expectedStatus: number,
    readonly response: ApiResponse<unknown>,
    logs: string,
  ) {
    super(
      `${action}: expected status ${expectedStatus}, but got ${response.status}\n\nRecent API logs:\n${logs}`,
    );
    this.name = 'ApiActionError';
  }
}
