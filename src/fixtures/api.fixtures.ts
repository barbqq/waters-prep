import { test as base } from '@playwright/test';

import { config } from '@core/config';
import { ApiActionRunner } from '@core/api/api-action-runner';
import { ApiClient } from '@core/api/api.client';
import { PlaywrightLogger } from '@core/logger/playwright-logger';
import { stepLogger } from '@core/logger/step-logger';
import { DeviceActions } from '@api/device.actions';
import { DeviceGateway } from '@api/device.gateway';

interface Fixtures {
  deviceActions: DeviceActions;
}

export const test = base.extend<Fixtures>({
  deviceActions: async ({ request }, use) => {
    const logger = new PlaywrightLogger();
    const client = new ApiClient(request, config.api.baseURL, logger);
    const deviceActions = new DeviceActions(
      new DeviceGateway(client),
      new ApiActionRunner(),
      logger,
    );

    await use(deviceActions);

    // Таргет — общий публичный датасет: не оставляем в нём созданные устройства,
    // если тест упал где-то между provision и decommission.
    await stepLogger.fixture('Clean up devices created by this test', () =>
      deviceActions.cleanup(),
    );
  },
});

export { expect } from '@playwright/test';
