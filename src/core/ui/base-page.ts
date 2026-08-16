import { expect, Locator, Page } from '@playwright/test';

import { step } from '@core/decorator';

export class BasePage {
  constructor(
    protected readonly name: string,
    protected readonly page: Page,
    protected readonly formLocator: Locator,
  ) {}

  @step('Opening page by path {0}')
  protected async goto(path: string): Promise<void> {
    await this.page.goto(path);
    await this.verifyPageOpened();
  }

  @step('Verifying that page is opened')
  async verifyPageOpened(): Promise<void> {
    const message = `${this.name} :: page should be opened`;
    await expect(this.formLocator, { message }).toBeVisible();
  }
}
