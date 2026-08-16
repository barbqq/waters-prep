import { test } from '@fixtures/pages.fixtures';
import { expect } from '@playwright/test';
import { parseOpenWeatherResponse } from '../../src/utils/weather.api.utls';

const CITY_NAME = 'Minsk';
const ONE_CALL_WIDGET_URL = '**/api/widget/onecall*';
const OUT_OF_RANGE_TEMPERATURE = 999;

test('Check baseline displayed correctly', async ({ page, searchPage, weatherPage }) => {
  await searchPage.verifyPageOpened();

  const apiTempPromise = new Promise<number>((resolve) => {
    void page.route(ONE_CALL_WIDGET_URL, async (route) => {
      const response = await route.fetch();
      const json = await parseOpenWeatherResponse(response);

      resolve(Math.round(json.current.temp));
      await route.fulfill({ response });
    });
  });

  await searchPage.selectCity(CITY_NAME);

  const apiTemp = await apiTempPromise;
  await expect(weatherPage.temperatureLocator).toContainText(apiTemp.toString());
});

test('Check out-of-range hardware reading (999°C) displayed correctly', async ({
  page,
  searchPage,
  weatherPage,
}) => {
  await searchPage.verifyPageOpened();

  await page.route(ONE_CALL_WIDGET_URL, async (route) => {
    const response = await route.fetch();
    const json = await parseOpenWeatherResponse(response);

    json.current.temp = OUT_OF_RANGE_TEMPERATURE;

    await route.fulfill({
      status: response.status(),
      json,
    });
  });

  await searchPage.selectCity(CITY_NAME);

  await expect(weatherPage.temperatureLocator).toContainText(OUT_OF_RANGE_TEMPERATURE.toString());
});

test('Check UI handles HTTP 500 server error gracefully', async ({
  page,
  searchPage,
  weatherPage,
}) => {
  await searchPage.verifyPageOpened();

  await page.route(ONE_CALL_WIDGET_URL, async (route) => {
    await route.fulfill({
      status: 500,
    });
  });

  await searchPage.selectCity(CITY_NAME);

  await expect(weatherPage.warningMessageLocator).toBeVisible();
});
