import { test } from '@fixtures/opcua.fixtures';
import { TelemetryAssertions } from '@assertions/telemetry.assertions';
import { OPCUA_NODES } from '@data/opcua.data';

test('address space exposes simulator variables', async ({ telemetry }) => {
  const variables = await telemetry.discoverVariables(OPCUA_NODES.OBJECTS_FOLDER);

  await TelemetryAssertions.assertVariablesDiscovered(variables);
});
