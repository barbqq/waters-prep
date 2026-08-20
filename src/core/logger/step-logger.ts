import { test } from '@playwright/test';

// box: true — ошибка внутри шага репортится по месту вызова, а не внутри обёртки.
const makeStep = async <T>(prefix: string, name: string, fn: () => T | Promise<T>): Promise<T> =>
  test.step(`[${prefix}] ${name}`, async () => Promise.resolve(fn()), { box: true });

export const stepLogger = {
  api: async <T>(name: string, fn: () => T | Promise<T>): Promise<T> => makeStep('API', name, fn),
  ui: async <T>(name: string, fn: () => T | Promise<T>): Promise<T> => makeStep('UI', name, fn),
  opcua: async <T>(name: string, fn: () => T | Promise<T>): Promise<T> =>
    makeStep('OPCUA', name, fn),
  assertion: async <T>(name: string, fn: () => T | Promise<T>): Promise<T> =>
    makeStep('Assertion', name, fn),
  fixture: async <T>(name: string, fn: () => T | Promise<T>): Promise<T> =>
    makeStep('Fixture', name, fn),
};
