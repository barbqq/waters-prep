import { test as base } from '@playwright/test';
import { SearchPage } from '@pages/search-page';
import { WeatherPage } from '@pages/weather-page';

interface Fixtures {
  searchPage: SearchPage;
  weatherPage: WeatherPage;
}

export const test = base.extend<Fixtures>({
  searchPage: async ({ page }, use) => {
    const searchPage = new SearchPage(page);
    await searchPage.navigate();
    await use(searchPage);
  },
  weatherPage: async ({ page }, use) => {
    const weatherPage = new WeatherPage(page);
    await use(weatherPage);
  },
});
