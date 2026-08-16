import { BasePage } from '@core/ui/base-page';
import { Locator, Page } from '@playwright/test';

export class WeatherPage extends BasePage {
  private readonly temperature: Locator;
  private readonly warningMessage: Locator;
  constructor(page: Page) {
    super('Weather page', page, page.getByText('Weather Data'));
    this.temperature = page.locator('.weather-current-weather span.align-baseline').locator('..');
    this.warningMessage = page.getByText('Unable to load weather');
  }

  get temperatureLocator(): Locator {
    return this.temperature;
  }

  get warningMessageLocator(): Locator {
    return this.warningMessage;
  }
}
