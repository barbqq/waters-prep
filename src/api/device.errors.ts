import { DeviceStatus } from '@api/device.types';

export class InvalidTransitionError extends Error {
  constructor(
    readonly deviceId: string,
    readonly from: DeviceStatus | 'unknown',
    readonly to: DeviceStatus,
  ) {
    super(`Invalid transition ${from} -> ${to} for device ${deviceId}`);
    this.name = 'InvalidTransitionError';
  }
}
