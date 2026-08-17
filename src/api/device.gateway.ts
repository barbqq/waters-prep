import { BaseApiClient } from '@core/api/api.client';
import { Device, DevicePayload, DeviceSpec } from '@api/device.types';

export class DeviceGateway extends BaseApiClient {
  async provisionDevice(name: string, data: DeviceSpec): Promise<Device> {
    const { body } = await this.post<DevicePayload, Device>('/objects', { name, data }, 200);
    return body;
  }

  async getDevice(id: string): Promise<Device> {
    const { body } = await this.get<Device>(`/objects/${id}`, 200);
    return body;
  }

  async getDeviceStatus(id: string): Promise<number> {
    const { status } = await this.get(`/objects/${id}`);
    return status;
  }

  async replaceDevice(id: string, name: string, data: DeviceSpec): Promise<Device> {
    const { body } = await this.put<DevicePayload, Device>(`/objects/${id}`, { name, data }, 200);
    return body;
  }

  async deleteDevice(id: string): Promise<void> {
    await this.delete(`/objects/${id}`, 200);
  }
}
