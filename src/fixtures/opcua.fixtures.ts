import { test as base } from '@playwright/test';

import { config } from '@core/config';
import { PlaywrightLogger } from '@core/logger/playwright-logger';
import { stepLogger } from '@core/logger/step-logger';
import { OpcUaClient } from '@core/opcua/opcua.client';
import { TelemetryActions } from '@opcua/telemetry.actions';

interface Fixtures {
  /** Подключённый доменный слой — для тестов телеметрии. */
  telemetry: TelemetryActions;
  /**
   * Фабрика «сырых» клиентов без подключения — для тестов жизненного цикла,
   * которым нужен свой эндпоинт или контроль над моментом отключения.
   */
  createClient: (endpointUrl?: string) => OpcUaClient;
}

export const test = base.extend<Fixtures>({
  // eslint-disable-next-line no-empty-pattern
  createClient: async ({}, use) => {
    const created: OpcUaClient[] = [];

    await use((endpointUrl: string = config.opcua.endpoint) => {
      const client = new OpcUaClient(endpointUrl, new PlaywrightLogger());
      created.push(client);
      return client;
    });

    // disconnect идемпотентен, поэтому безопасен и для неподключившихся клиентов,
    // и для тех, кого тест закрыл сам.
    await stepLogger.fixture('Disconnect OPC UA clients created by this test', async () => {
      for (const client of created) {
        await client.disconnect();
      }
    });
  },

  telemetry: async ({ createClient }, use) => {
    const telemetry = new TelemetryActions(createClient(), new PlaywrightLogger());

    await telemetry.connect();
    await use(telemetry);
  },
});

export { expect } from '@playwright/test';
