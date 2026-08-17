import { test } from '@fixtures/api.fixtures';
import { DeviceAssertions } from '@assertions/device.assertions';
import { DeviceSpec } from '@api/device.types';

test('device provisioning lifecycle', async ({ deviceActions }) => {
  const spec: Omit<DeviceSpec, 'status'> = {
    model: 'TX-100',
    sensor_type: 'temperature',
    firmware: 'v1.2.0',
  };

  const provisioned = await deviceActions.provisionDevice(spec);
  DeviceAssertions.assertMatchesSpec(provisioned, { ...spec, status: 'provisioned' });

  const fetched = await deviceActions.getDevice(provisioned.id);
  DeviceAssertions.assertMatchesSpec(fetched, { ...spec, status: 'provisioned' });

  await DeviceAssertions.assertRejectsInvalidTransition(
    deviceActions.decommissionDevice(provisioned.id),
  );

  const updated = await deviceActions.updateFirmware(provisioned.id, 'v1.3.1');
  DeviceAssertions.assertMatchesSpec(updated, { ...spec, firmware: 'v1.3.1', status: 'active' });

  const refetched = await deviceActions.getDevice(provisioned.id);
  DeviceAssertions.assertFirmware(refetched, 'v1.3.1');

  await deviceActions.decommissionDevice(provisioned.id);

  const statusAfterDelete = await deviceActions.getDeviceStatus(provisioned.id);
  DeviceAssertions.assertDeviceNotFound(statusAfterDelete);
});
