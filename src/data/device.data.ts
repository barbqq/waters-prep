import { DeviceSpec, FirmwareVersion, SensorType } from '@api/device.types';

// `satisfies` проверяет каждое значение на соответствие FirmwareVersion,
// а `as const` оставляет их литеральными типами, а не расширяет до string.
export const FIRMWARE = {
  INITIAL: 'v1.2.0',
  UPDATED: 'v1.3.1',
} as const satisfies Record<string, FirmwareVersion>;

export const TX_100_SPEC: Omit<DeviceSpec, 'status'> = {
  model: 'TX-100',
  sensor_type: SensorType.TEMPERATURE,
  firmware: FIRMWARE.INITIAL,
};
