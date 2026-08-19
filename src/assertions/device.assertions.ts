import { expect } from '@playwright/test';

import { stepLogger } from '@core/logger/step-logger';
import { InvalidTransitionError } from '@api/device.errors';
import { Device, DeviceSpec, FirmwareVersion } from '@api/device.types';

export class DeviceAssertions {
  static async assertMatchesSpec(device: Device, spec: DeviceSpec): Promise<void> {
    await stepLogger.assertion(`Verify device ${device.id} against submitted specs`, () => {
      expect(device.id, 'Response should contain a generated device id').toBeTruthy();
      expect(
        device.data,
        `Device body - ${JSON.stringify(device.data)} should be equal ${JSON.stringify(spec)}`,
      ).toMatchObject(spec);
      expect(device.data.status, `Device status should be ${spec.status}`).toBe(spec.status);
    });
  }

  static async assertFirmware(device: Device, firmware: FirmwareVersion): Promise<void> {
    await stepLogger.assertion(`Verify firmware of device ${device.id}`, () => {
      expect(device.data.firmware, `Device firmware - ${device.data.firmware} should be ${firmware}`).toBe(firmware);
    });
  }

  static async assertRejectsInvalidTransition(action: Promise<unknown>): Promise<void> {
    await stepLogger.assertion('Client refuses an invalid lifecycle transition', async () => {
      await expect(
        action,
        'Decommission must be refused while the device is not active',
      ).rejects.toThrow(InvalidTransitionError);
    });
  }
}
