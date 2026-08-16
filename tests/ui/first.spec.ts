import { kelvinToCelsius } from '@core/temp.utils';
import { test } from '@fixtures/pages.fixtures';
import { expect } from '@playwright/test';

interface OpenWeatherResponse {
  main: {
    temp: number;
  };
}

const CITY_NAME = 'Minsk';
const WEATHER_API_URL_PATTERN = '**/data/2.5/weather*';

test('Check baseline displayed correctly', async ({ page, searchPage, weatherPage }) => {
  await searchPage.verifyPageOpened();

  const apiTempPromise = new Promise<number>((resolve) => {
    void page.route(WEATHER_API_URL_PATTERN, async (route) => {
      const response = await route.fetch();
      const json = (await response.json()) as OpenWeatherResponse;

      resolve(kelvinToCelsius(json.main.temp));
      await route.fulfill({ response });
    });
  });

  await searchPage.selectCity(CITY_NAME);

  const apiTemp = await apiTempPromise;
  await expect(weatherPage.temperatureLocator).toContainText(apiTemp.toString());
});
