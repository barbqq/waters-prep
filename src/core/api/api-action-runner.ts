import { test } from '@playwright/test';

import { ApiActionError } from '@core/api/api-action.error';
import { ApiResponse } from '@core/api/api.types';
import { ApiLogger } from '@core/api/logger';

export class ApiActionRunner {
  constructor(private readonly logger: ApiLogger) {}

  performAction<TBody>(
    action: string,
    call: () => Promise<ApiResponse<TBody>>,
    expectedStatus?: number,
  ): Promise<ApiResponse<TBody>> {
    return test.step(
      action,
      async () => {
        const response = await call();

        if (expectedStatus !== undefined && response.status !== expectedStatus) {
          throw new ApiActionError(action, expectedStatus, response, this.logger.getRecentLogs());
        }

        return response;
      },
      { box: true },
    );
  }
}
