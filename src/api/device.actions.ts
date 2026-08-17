import { step } from '@core/decorator';
import { DeviceGateway } from '@api/device.gateway';
import { InvalidTransitionError } from '@api/device.errors';
import { ALLOWED_TRANSITIONS, Device, DeviceSpec, DeviceStatus } from '@api/device.types';

// Бизнес-операции над устройством: держит состояние переходов и проверяет их
// сама (assertTransition), прежде чем идти в Gateway — публичный API это не делает.
export class DeviceActions {
  private readonly devices = new Map<string, DeviceSpec>();

  constructor(private readonly gateway: DeviceGateway) {}

  @step('Provisioning device')
  async provisionDevice(spec: Omit<DeviceSpec, 'status'>): Promise<Device> {
    const data: DeviceSpec = { ...spec, status: 'provisioned' };
    const device = await this.gateway.provisionDevice(spec.model, data);
    this.devices.set(device.id, device.data);
    return device;
  }

  @step('Getting device {0}')
  async getDevice(id: string): Promise<Device> {
    return this.gateway.getDevice(id);
  }

  @step('Getting response status for device {0}')
  async getDeviceStatus(id: string): Promise<number> {
    return this.gateway.getDeviceStatus(id);
  }

  @step('Updating firmware of device {0} to {1}')
  async updateFirmware(id: string, firmware: string): Promise<Device> {
    const current = this.assertTransition(id, 'active');
    const data: DeviceSpec = { ...current, firmware, status: 'active' };
    const device = await this.gateway.replaceDevice(id, current.model, data);
    this.devices.set(id, device.data);
    return device;
  }

  @step('Decommissioning device {0}')
  async decommissionDevice(id: string): Promise<void> {
    const current = this.assertTransition(id, 'decommissioned');
    await this.gateway.deleteDevice(id);
    this.devices.set(id, { ...current, status: 'decommissioned' });
  }

  async cleanup(): Promise<void> {
    for (const [id, spec] of this.devices) {
      if (spec.status === 'decommissioned') continue;
      await this.gateway.deleteDevice(id).catch(() => undefined);
    }
    this.devices.clear();
  }

  private assertTransition(id: string, target: DeviceStatus): DeviceSpec {
    const current = this.devices.get(id);
    if (!current || !ALLOWED_TRANSITIONS[current.status].includes(target)) {
      throw new InvalidTransitionError(id, current?.status ?? 'unknown', target);
    }
    return current;
  }
}
