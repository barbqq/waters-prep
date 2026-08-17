import { BaseApiClient } from '@core/api/api.client';
import { Device, DevicePayload, DeviceSpec } from '@api/device.types';

// Только сырые вызовы конкретных эндпоинтов, без бизнес-правил и состояния —
// решение "провалидировать переход или нет" принимает DeviceActions.
export class DeviceGateway extends BaseApiClient {
  provisionDevice(name: string, data: DeviceSpec): Promise<Device> {
    return this.post<DevicePayload, Device>('/objects', { name, data }, 200);
  }

  getDevice(id: string): Promise<Device> {
    return this.get<Device>(`/objects/${id}`, 200);
  }

  verifyDecommissioned(id: string): Promise<void> {
    return this.get(`/objects/${id}`, 404);
  }

  replaceDevice(id: string, name: string, data: DeviceSpec): Promise<Device> {
    return this.put<DevicePayload, Device>(`/objects/${id}`, { name, data }, 200);
  }

  deleteDevice(id: string): Promise<void> {
    return this.delete(`/objects/${id}`, 200);
  }
}
