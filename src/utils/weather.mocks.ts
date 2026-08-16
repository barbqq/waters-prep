// src/utils/weather.mocks.ts
import { Page } from '@playwright/test';
import { parseOpenWeatherResponse } from './weather.api.utls';

export const ONE_CALL_WIDGET_URL = '**/api/widget/onecall*';

export async function mockWeatherTemperature(page: Page, temp: number) {
  await page.route(ONE_CALL_WIDGET_URL, async (route) => {
    const response = await route.fetch();
    const json = await parseOpenWeatherResponse(response);
    json.current.temp = temp;

    await route.fulfill({ response, json });
  });
}

export async function mockWeatherError(page: Page, status = 500) {
  await page.route(ONE_CALL_WIDGET_URL, (route) => route.fulfill({ status }));
}
