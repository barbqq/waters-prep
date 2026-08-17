export type DeviceStatus = 'provisioned' | 'active' | 'decommissioned';

export interface DeviceSpec {
  model: string;
  sensor_type: string;
  firmware: string;
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

// Единственная точка входа в жизненный цикл — provisionDevice (всегда 'provisioned').
// Публичный API устройств не проверяет переходы сам, поэтому это делает DeviceApiClient.
export const ALLOWED_TRANSITIONS: Record<DeviceStatus, DeviceStatus[]> = {
  provisioned: ['active'],
  active: ['decommissioned'],
  decommissioned: [],
};
