import { Locator, Page } from '@playwright/test';

import { step } from '@core/decorator';
import { BasePage } from '@core/ui/base-page';

export class SearchPage extends BasePage {
  private readonly searchInput: Locator;

  constructor(page: Page) {
    super('Search page', page, page.getByText('Build with Weather Data'));
    this.searchInput = page.getByPlaceholder('Search City');
  }

  async navigate(): Promise<void> {
    await this.goto('/');
  }

  @step('Searching and selecting city {0}')
  async selectCity(city: string): Promise<void> {
    await this.searchInput.fill(city);
    await this.cityOption(city).click();
  }

  private cityOption(city: string): Locator {
    return this.page
      .locator('div[class*="absolute"]')
      .getByRole('button')
      .filter({ hasText: city })
      .first();
  }
}
