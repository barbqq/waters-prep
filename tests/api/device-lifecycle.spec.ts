import { test } from '@fixtures/api.fixtures';
import { DeviceAssertions } from '@assertions/device.assertions';
import { HttpStatus } from '@core/api/api.types';
import { DeviceStatus } from '@api/device.types';
import { FIRMWARE, TX_100_SPEC } from '@data/device.data';

test('device provisioning lifecycle', async ({ deviceActions }) => {
  const provisioned = await deviceActions.provisionDevice(TX_100_SPEC);
  await DeviceAssertions.assertMatchesSpec(provisioned.body, {
    ...TX_100_SPEC,
    status: DeviceStatus.PROVISIONED,
  });

  const deviceId = provisioned.body.id;

  const fetched = await deviceActions.getDevice(deviceId);
  await DeviceAssertions.assertMatchesSpec(fetched.body, {
    ...TX_100_SPEC,
    status: DeviceStatus.PROVISIONED,
  });

  await DeviceAssertions.assertRejectsInvalidTransition(deviceActions.decommissionDevice(deviceId));

  const updated = await deviceActions.updateFirmware(deviceId, FIRMWARE.UPDATED);
  await DeviceAssertions.assertMatchesSpec(updated.body, {
    ...TX_100_SPEC,
    firmware: FIRMWARE.UPDATED,
    status: DeviceStatus.ACTIVE,
  });

  const refetched = await deviceActions.getDevice(deviceId);
  await DeviceAssertions.assertFirmware(refetched.body, FIRMWARE.UPDATED);

  await deviceActions.decommissionDevice(deviceId);

  await deviceActions.getDevice(deviceId, HttpStatus.NOT_FOUND);
});
