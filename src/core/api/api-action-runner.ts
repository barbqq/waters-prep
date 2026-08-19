import { ApiActionError } from '@core/api/api-action.error';
import { ApiResponse } from '@core/api/api.types';
import { stepLogger } from '@core/logger/step-logger';

export class ApiActionRunner {
  performAction<TBody>(
    action: string,
    call: () => Promise<ApiResponse<TBody>>,
    expectedStatus?: number,
  ): Promise<ApiResponse<TBody>> {
    return stepLogger.api(action, async () => {
      const response = await call();

      if (expectedStatus !== undefined && response.status !== expectedStatus) {
        throw new ApiActionError(action, expectedStatus, response);
      }

      return response;
    });
  }
}
