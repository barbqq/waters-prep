import { test as base } from '@playwright/test';

import { config } from '@core/config';
import { PlaywrightLogger } from '@core/logger/playwright-logger';
import { OpcUaClient } from '@core/opcua/opcua.client';
import { TelemetryActions } from '@opcua/telemetry.actions';

interface Fixtures {
  telemetry: TelemetryActions;
}

export const test = base.extend<Fixtures>({
  // Тест на недоступный эндпоинт этой фикстурой не пользуется — он поднимает
  // собственный OpcUaClient, потому что здесь connect обязан пройти.
  // eslint-disable-next-line no-empty-pattern
  telemetry: async ({}, use) => {
    const logger = new PlaywrightLogger();
    const telemetry = new TelemetryActions(new OpcUaClient(config.opcua.endpoint, logger), logger);

    await telemetry.connect();
    await use(telemetry);
    await telemetry.disconnect();
  },
});

export { expect } from '@playwright/test';
