import { expect } from '@playwright/test';

import { stepLogger } from '@core/logger/step-logger';
import { BrowsedNode } from '@core/opcua/opcua.types';

export class TelemetryAssertions {
  static async assertVariablesDiscovered(variables: BrowsedNode[]): Promise<void> {
    await stepLogger.assertion(`Verify address space exposes readable variables`, () => {
      expect(
        variables.length,
        'Browsing the address space should discover at least one variable node',
      ).toBeGreaterThan(0);
    });
  }
}
