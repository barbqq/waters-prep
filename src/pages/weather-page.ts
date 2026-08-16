import { BasePage } from '@core/ui/base-page';
import { Locator, Page } from '@playwright/test';

export class WeatherPage extends BasePage {
  private readonly temperature: Locator;
  constructor(page: Page) {
    super('Weather page', page, page.getByText('Weather Data'));
    this.temperature = page.locator('.weather-current-weather span.align-baseline').locator('..');
  }

  get temperatureLocator(): Locator {
    return this.temperature;
  }
}
