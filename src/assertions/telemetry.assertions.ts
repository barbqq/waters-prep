import { expect } from '@playwright/test';

import { stepLogger } from '@core/logger/step-logger';
import { OpcUaConnectionError, OpcUaNotConnectedError } from '@core/opcua/opcua.errors';
import {
  BrowsedNode,
  GOOD_STATUS,
  OpcUaDataTypeName,
  OpcUaReading,
} from '@core/opcua/opcua.types';
import { DEFAULT_POLL_OPTIONS } from '@core/utils/poll.options';


const MIN_NOTIFICATIONS = 2;

const CONNECT_FAILURE_BUDGET_MS = 5_000;

export class TelemetryAssertions {
  static async assertVariablesDiscovered(variables: BrowsedNode[]): Promise<void> {
    await stepLogger.assertion('Verify address space exposes readable variables', () => {
      expect(
        variables.length,
        'Browsing the address space should discover at least one variable node',
      ).toBeGreaterThan(0);
    });
  }

  static async assertContainsNode(variables: BrowsedNode[], nodeId: string): Promise<void> {
    await stepLogger.assertion(`Verify address space contains ${nodeId}`, () => {
      expect(
        variables.map((variable) => variable.nodeId),
        `Node ${nodeId} used by the telemetry tests should be discoverable by browsing`,
      ).toContain(nodeId);
    });
  }

  static async assertNumericReading(
    reading: OpcUaReading,
    expectedType: OpcUaDataTypeName,
  ): Promise<void> {
    await stepLogger.assertion(`Verify read of ${reading.nodeId} succeeded`, () => {
      expect(reading.statusCode, `Read should return status ${GOOD_STATUS}`).toBe(GOOD_STATUS);
      expect(reading.dataType, `Node should expose a ${expectedType} value`).toBe(expectedType);
      expect(typeof reading.value, 'Numeric node should deserialise to a JS number').toBe('number');
    });
  }

  static async assertConnectionRefusedQuickly(connect: () => Promise<void>): Promise<void> {
    await stepLogger.assertion('Verify unreachable endpoint is rejected quickly', async () => {
      const startedAt = Date.now();

      await expect(
        connect(),
        'Connecting to an unreachable endpoint must reject, not hang',
      ).rejects.toThrow(OpcUaConnectionError);

      const elapsedMs = Date.now() - startedAt;

      expect(
        elapsedMs,
        `Connection attempt should fail fast, took ${elapsedMs} ms`,
      ).toBeLessThan(CONNECT_FAILURE_BUDGET_MS);
    });
  }

  static async assertDisconnectIsClean(disconnect: () => Promise<void>): Promise<void> {
    await stepLogger.assertion('Verify disconnect resolves cleanly and is idempotent', async () => {
      await expect(disconnect(), 'Disconnect should resolve without error').resolves.toBeUndefined();
      await expect(
        disconnect(),
        'Repeated disconnect should be a no-op, not an error',
      ).resolves.toBeUndefined();
    });
  }

  static async assertReadRejectedAfterDisconnect(read: () => Promise<unknown>): Promise<void> {
    await stepLogger.assertion('Verify reads are rejected once the session is closed', async () => {
      await expect(
        read(),
        'Reading after disconnect should fail with a typed error, not a TypeError',
      ).rejects.toThrow(OpcUaNotConnectedError);
    });
  }

  static async assertDataChangeNotified(notifications: OpcUaReading[]): Promise<void> {
    await stepLogger.assertion('Verify subscription delivers data-change notifications', async () => {
      await expect
        .poll(() => notifications.length, {
          ...DEFAULT_POLL_OPTIONS,
          message:
            'Subscription should deliver the initial value followed by at least one change notification',
        })
        .toBeGreaterThanOrEqual(MIN_NOTIFICATIONS);
    });
  }

  static async assertValueChanges(
    initial: OpcUaReading,
    read: () => Promise<OpcUaReading>,
  ): Promise<void> {
    await stepLogger.assertion(`Verify ${initial.nodeId} produces live values`, async () => {
      await expect
        .poll(async () => (await read()).value, {
          ...DEFAULT_POLL_OPTIONS,
          message: `Value of ${initial.nodeId} should change from ${JSON.stringify(initial.value)} — a frozen value would mean stale or cached data`,
        })
        .not.toBe(initial.value);
    });
  }
}
