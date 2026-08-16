import { test as base } from '@playwright/test';
import { SearchPage } from '@pages/search-page';

interface Fixtures {
  searchPage: SearchPage;
}

export const test = base.extend<Fixtures>({
  searchPage: async ({ page }, use) => {
    const searchPage = new SearchPage(page);
    await searchPage.navigate();
    await use(searchPage);
  },
});
