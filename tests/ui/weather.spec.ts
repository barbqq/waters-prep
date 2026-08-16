import { test } from '@fixtures/pages.fixtures';
import { expect } from '@playwright/test';
import { parseOpenWeatherResponse } from '../../src/utils/weather.api.utls';
import {
  ONE_CALL_WIDGET_URL,
  mockWeatherTemperature,
  mockWeatherError,
} from '../../src/utils/weather.mocks';

const CITY_NAME = 'Minsk';
const OUT_OF_RANGE_TEMPERATURE = 999;

test.describe('Weather Widget Tests', () => {
  test.beforeEach(async ({ searchPage }) => {
    await searchPage.verifyPageOpened();
  });

  test('Check baseline displayed correctly', async ({ page, searchPage, weatherPage }) => {
    const responsePromise = page.waitForResponse(ONE_CALL_WIDGET_URL);

    await searchPage.selectCity(CITY_NAME);

    const response = await responsePromise;
    const json = await parseOpenWeatherResponse(response);
    const expectedTemp = Math.round(json.current.temp);

    await expect(weatherPage.temperatureLocator).toContainText(expectedTemp.toString());
  });

  test('Check out-of-range hardware reading (999°C) displayed correctly', async ({
    page,
    searchPage,
    weatherPage,
  }) => {
    await mockWeatherTemperature(page, OUT_OF_RANGE_TEMPERATURE);
    await searchPage.selectCity(CITY_NAME);

    await expect(weatherPage.temperatureLocator).toContainText(OUT_OF_RANGE_TEMPERATURE.toString());
  });

  test('Check UI handles HTTP 500 server error gracefully', async ({
    page,
    searchPage,
    weatherPage,
  }) => {
    await mockWeatherError(page, 500);
    await searchPage.selectCity(CITY_NAME);

    await expect(weatherPage.warningMessageLocator).toBeVisible();
  });
});
