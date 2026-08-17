import { expect } from '@playwright/test';

import { InvalidTransitionError } from '@api/device.errors';
import { Device, DeviceSpec } from '@api/device.types';

export class DeviceAssertions {
  static assertMatchesSpec(device: Device, spec: DeviceSpec): void {
    expect(device.id, 'Device should have a generated id').toBeTruthy();
    expect(device.data).toEqual(spec);
  }

  static assertFirmware(device: Device, firmware: string): void {
    expect(device.data.firmware).toBe(firmware);
  }

  static assertDeviceNotFound(status: number): void {
    expect(status, 'Decommissioned device should no longer be retrievable').toBe(404);
  }

  static async assertRejectsInvalidTransition(action: Promise<unknown>): Promise<void> {
    await expect(action, 'Client should refuse an invalid lifecycle transition').rejects.toThrow(
      InvalidTransitionError,
    );
  }
}
