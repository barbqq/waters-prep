export enum DeviceStatus {
  PROVISIONED = 'provisioned',
  ACTIVE = 'active',
  DECOMMISSIONED = 'decommissioned',
}

export enum SensorType {
  TEMPERATURE = 'temperature',
  HUMIDITY = 'humidity',
  PRESSURE = 'pressure',
}

export type FirmwareVersion = `v${number}.${number}.${number}`;

export interface DeviceSpec {
  model: string;
  sensor_type: SensorType;
  firmware: FirmwareVersion;
  status: DeviceStatus;
}

export interface Device {
  id: string;
  name: string;
  data: DeviceSpec;
}

export interface DevicePayload {
  name: string;
  data: DeviceSpec;
}

export const ALLOWED_TRANSITIONS: Record<DeviceStatus, DeviceStatus[]> = {
  [DeviceStatus.PROVISIONED]: [DeviceStatus.ACTIVE],
  [DeviceStatus.ACTIVE]: [DeviceStatus.ACTIVE, DeviceStatus.DECOMMISSIONED],
  [DeviceStatus.DECOMMISSIONED]: [],
};
