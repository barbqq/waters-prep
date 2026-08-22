import { test } from '@fixtures/opcua.fixtures';
import { TelemetryAssertions } from '@assertions/telemetry.assertions';
import { OPCUA_NODES, UNREACHABLE_ENDPOINT } from '@data/opcua.data';

test.describe('OPC UA connection lifecycle', () => {
  test('unreachable endpoint is rejected with a typed error instead of hanging', async ({
    createClient,
  }) => {
    const client = createClient(UNREACHABLE_ENDPOINT);

    await TelemetryAssertions.assertConnectionRefusedQuickly(() => client.connect());
  });

  test('disconnect closes the session and leaves no usable handle behind', async ({
    createClient,
  }) => {
    const client = createClient();

    await client.connect();
    await client.subscribeToNode(OPCUA_NODES.FAST_COUNTER, () => undefined);
    await client.readNode(OPCUA_NODES.FAST_COUNTER);

    await TelemetryAssertions.assertDisconnectIsClean(() => client.disconnect());
    await TelemetryAssertions.assertReadRejectedAfterDisconnect(() =>
      client.readNode(OPCUA_NODES.FAST_COUNTER),
    );
  });
});
