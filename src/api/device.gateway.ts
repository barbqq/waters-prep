import { ApiClient } from '@core/api/api.client';
import { ApiResponse } from '@core/api/api.types';
import { Device, DevicePayload, DeviceSpec } from '@api/device.types';

export class DeviceGateway {
  constructor(private readonly client: ApiClient) {}

  provisionDevice(name: string, data: DeviceSpec): Promise<ApiResponse<Device>> {
    return this.client.post<DevicePayload, Device>('/objects', { name, data });
  }

  getDevice(id: string): Promise<ApiResponse<Device>> {
    return this.client.get<Device>(`/objects/${id}`);
  }

  replaceDevice(id: string, name: string, data: DeviceSpec): Promise<ApiResponse<Device>> {
    return this.client.put<DevicePayload, Device>(`/objects/${id}`, { name, data });
  }

  deleteDevice(id: string): Promise<ApiResponse<unknown>> {
    return this.client.delete(`/objects/${id}`);
  }
}
