import { Device, DeviceStatus } from '@api/device.types';

export class InvalidTransitionError extends Error {
  constructor(
    readonly device: Device,
    readonly target: DeviceStatus,
  ) {
    super(
      `Invalid transition ${device.data.status} -> ${target} for device ${device.id}\n\n` +
        `Current device state:\n${JSON.stringify(device, null, 2)}`,
    );
    this.name = 'InvalidTransitionError';
  }
}
