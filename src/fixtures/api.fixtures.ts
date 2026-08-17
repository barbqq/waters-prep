import { test as base } from '@playwright/test';

import { config } from '@core/config';
import { ApiLogger } from '@core/api/logger';
import { DeviceActions } from '@api/device.actions';
import { DeviceGateway } from '@api/device.gateway';

interface Fixtures {
  deviceActions: DeviceActions;
}

export const test = base.extend<Fixtures>({
  deviceActions: async ({ request }, use) => {
    const gateway = new DeviceGateway(request, config.api.baseURL, new ApiLogger());
    const deviceActions = new DeviceActions(gateway);

    await use(deviceActions);

    // Таргет — общий публичный датасет: не оставляем в нём созданные устройства,
    // если тест упал где-то между provision и decommission.
    await deviceActions.cleanup();
  },
});

export { expect } from '@playwright/test';
