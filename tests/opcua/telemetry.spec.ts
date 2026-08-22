import { test } from '@fixtures/opcua.fixtures';
import { TelemetryAssertions } from '@assertions/telemetry.assertions';
import { OpcUaReading } from '@core/opcua/opcua.types';
import { OPCUA_NODES } from '@data/opcua.data';

test.describe('device telemetry over OPC UA', () => {
  test('address space exposes the simulator telemetry nodes', async ({ telemetry }) => {
    const variables = await telemetry.discoverVariables(OPCUA_NODES.TELEMETRY_FOLDER);

    await TelemetryAssertions.assertVariablesDiscovered(variables);
    await TelemetryAssertions.assertContainsNode(variables, OPCUA_NODES.FAST_COUNTER);
  });

  test('simulated node returns a live value of the expected type', async ({ telemetry }) => {
    const nodeId = OPCUA_NODES.FAST_COUNTER;
    const reading = await telemetry.readNode(nodeId);

    await TelemetryAssertions.assertNumericReading(reading, 'UInt32');
    await TelemetryAssertions.assertValueChanges(reading, () => telemetry.readNode(nodeId));
  });

  test('subscription delivers data-change notifications', async ({ telemetry }) => {
    const notifications: OpcUaReading[] = [];

    await telemetry.subscribeToNode(OPCUA_NODES.FAST_COUNTER, (reading) => {
      notifications.push(reading);
    });

    await TelemetryAssertions.assertDataChangeNotified(notifications);
  });
});
