import { ApiActionRunner } from '@core/api/api-action-runner';
import { ApiResponse, HttpStatus } from '@core/api/api.types';
import { LogFormatter } from '@core/logger/log-formatter';
import { AttachmentLogger } from '@core/logger/logger.types';
import { DeviceGateway } from '@api/device.gateway';
import { InvalidTransitionError } from '@api/device.errors';
import {
  ALLOWED_TRANSITIONS,
  Device,
  DeviceSpec,
  DeviceStatus,
  FirmwareVersion,
} from '@api/device.types';

// Ожидаемый статус — параметр со значением по умолчанию, а не просто необязательный:
// забыть его нельзя, а в тесте явно указывается только то, что отличается от 200.
export class DeviceActions {
  // Только id созданных устройств — нужны для teardown. Состояние жизненного цикла
  // тут не дублируется: перед каждым переходом оно читается с сервера.
  private readonly createdIds = new Set<string>();

  constructor(
    private readonly gateway: DeviceGateway,
    private readonly runner: ApiActionRunner,
    private readonly logger: AttachmentLogger,
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

    this.createdIds.add(response.body.id);
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
    const current = await this.assertTransition(id, DeviceStatus.ACTIVE);
    const data: DeviceSpec = { ...current.data, firmware, status: DeviceStatus.ACTIVE };

    return this.runner.performAction(
      `Update firmware of device ${id} to ${firmware}`,
      () => this.gateway.replaceDevice(id, current.name, data),
      expectedStatus,
    );
  }

  async decommissionDevice(
    id: string,
    expectedStatus: number = HttpStatus.OK,
  ): Promise<ApiResponse<unknown>> {
    await this.assertTransition(id, DeviceStatus.DECOMMISSIONED);

    const response = await this.runner.performAction(
      `Decommission device ${id}`,
      () => this.gateway.deleteDevice(id),
      expectedStatus,
    );

    this.createdIds.delete(id);
    return response;
  }

 async cleanup(): Promise<void> {
    for (const id of this.createdIds) {
      await this.gateway.deleteDevice(id).catch(() => undefined);
    }
    this.createdIds.clear();
  }

  private async assertTransition(id: string, target: DeviceStatus): Promise<Device> {
    const { body } = await this.runner.performAction(
      `Check current state of device ${id}`,
      () => this.gateway.getDevice(id),
      HttpStatus.OK,
    );

    const allowed = ALLOWED_TRANSITIONS[body.data.status];

    if (!allowed.includes(target)) {
      await LogFormatter.attachJson(this.logger, 'Rejected transition', {
        deviceId: body.id,
        currentStatus: body.data.status,
        attemptedStatus: target,
        allowedFromCurrent: allowed,
        device: body,
      });

      throw new InvalidTransitionError(body, target);
    }

    return body;
  }
}
