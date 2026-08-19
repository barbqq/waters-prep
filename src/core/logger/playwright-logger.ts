import { test } from '@playwright/test';

import type { AttachmentLogger } from '@core/logger/logger.types';

// test.info() доступен только во время выполнения теста, поэтому опциональный вызов:
// вне теста аттачить некуда, и логирование просто становится no-op.
export class PlaywrightLogger implements AttachmentLogger {
  async attach(name: string, body: string, contentType: string): Promise<void> {
    await test.info()?.attach(name, { body, contentType });
  }
}
