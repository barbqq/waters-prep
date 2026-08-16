import { test } from "@fixtures/pages.fixtures";


test('Hardware State Mocking', async ({ searchPage }) => {
  await searchPage.verifyPageOpened();
  await searchPage.selectCity('Minsk');
});