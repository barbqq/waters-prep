import { ApiActionRunner } from '@core/api/api-action-runner';
import { ApiResponse, HttpStatus } from '@core/api/api.types';
import { DeviceGateway } from '@api/device.gateway';
import { InvalidTransitionError } from '@api/device.errors';
import {
  ALLOWED_TRANSITIONS,
  Device,
  DeviceSpec,
  DeviceStatus,
  FirmwareVersion,
} from '@api/device.types';

export class DeviceActions {
  private readonly devices = new Map<string, DeviceSpec>();

  constructor(
    private readonly gateway: DeviceGateway,
    private readonly runner: ApiActionRunner,
  ) {}

  async provisionDevice(
    spec: Omit<DeviceSpec, 'status'>,
    expectedStatus: number = HttpStatus.OK,
  ): Promise<ApiResponse<Device>> {
    const data: DeviceSpec = { ...spec, status: DeviceStatus.PROVISIONED };

    const response = await this.runner.performAction(
      `Provision device ${spec.model}`,
      () => this.gateway.provisionDevice(spec.model, data),
      expectedStatus,
    );

    this.devices.set(response.body.id, response.body.data);
    return response;
  }

  async getDevice(
    id: string,
    expectedStatus: number = HttpStatus.OK,
  ): Promise<ApiResponse<Device>> {
    return this.runner.performAction(
      `Get device ${id}`,
      () => this.gateway.getDevice(id),
      expectedStatus,
    );
  }

  async updateFirmware(
    id: string,
    firmware: FirmwareVersion,
    expectedStatus: number = HttpStatus.OK,
  ): Promise<ApiResponse<Device>> {
    const current = this.assertTransition(id, DeviceStatus.ACTIVE);
    const data: DeviceSpec = { ...current, firmware, status: DeviceStatus.ACTIVE };

    const response = await this.runner.performAction(
      `Update firmware of device ${id} to ${firmware}`,
      () => this.gateway.replaceDevice(id, current.model, data),
      expectedStatus,
    );

    this.devices.set(id, response.body.data);
    return response;
  }

  async decommissionDevice(
    id: string,
    expectedStatus: number = HttpStatus.OK,
  ): Promise<ApiResponse<unknown>> {
    const current = this.assertTransition(id, DeviceStatus.DECOMMISSIONED);

    const response = await this.runner.performAction(
      `Decommission device ${id}`,
      () => this.gateway.deleteDevice(id),
      expectedStatus,
    );

    this.devices.set(id, { ...current, status: DeviceStatus.DECOMMISSIONED });
    return response;
  }

  async cleanup(): Promise<void> {
    for (const [id, spec] of this.devices) {
      if (spec.status === DeviceStatus.DECOMMISSIONED) continue;
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
