// deno test tests/driverRegistration.test.ts
// Pure step validation only; no SMS, photos, database writes or user accounts.
import { assertEquals, assertThrows } from 'jsr:@std/assert@1';
import { driverRegistrationSteps, validateDriverNames, validateDriverPhotos, validateDriverVehicle, type DriverRegistrationData } from '../services/driverRegistrationService.ts';

const fixture = (): DriverRegistrationData => ({
  name: 'سائق', fatherName: 'أب', grandfatherName: 'جد', vehicleType: 'truck', maxCapacity: '12', province: 'بغداد',
  driverPhoto: 'file:///driver.jpg', licensePhoto: 'file:///license.jpg', vehiclePhoto: 'file:///truck.jpg',
});
Deno.test('Driver registration has exactly five ordered steps ending in account protection', () => {
  assertEquals(driverRegistrationSteps.map((item) => item.number), [1, 2, 3, 4, 5]);
  assertEquals(driverRegistrationSteps[1].title, 'رقم الهاتف والتحقق');
  assertEquals(driverRegistrationSteps[4].title, 'حماية الحساب');
});
Deno.test('Each name is required and capped at 120 characters', () => {
  validateDriverNames(fixture());
  for (const field of ['name', 'fatherName', 'grandfatherName'] as const) {
    for (const value of ['', '  ', 'a'.repeat(121)]) assertThrows(() => validateDriverNames({ ...fixture(), [field]: value }));
  }
});
Deno.test('Vehicle step rejects missing catalog selections and invalid capacity', () => {
  validateDriverVehicle(fixture(), ['truck'], ['بغداد']);
  validateDriverVehicle({ ...fixture(), maxCapacity: '١٢' }, ['truck'], ['بغداد']);
  validateDriverVehicle({ ...fixture(), maxCapacity: '۱۲.۵' }, ['truck'], ['بغداد']);
  for (const maxCapacity of ['', '0', '-1', '1001', 'NaN', 'Infinity', 'abc']) {
    assertThrows(() => validateDriverVehicle({ ...fixture(), maxCapacity }, ['truck'], ['بغداد']));
  }
  assertThrows(() => validateDriverVehicle({ ...fixture(), vehicleType: '' }, ['truck'], ['بغداد']));
  assertThrows(() => validateDriverVehicle({ ...fixture(), province: '' }, ['truck'], ['بغداد']));
});
Deno.test('Every one of the three photos is mandatory', () => {
  validateDriverPhotos(fixture());
  for (const field of ['driverPhoto', 'licensePhoto', 'vehiclePhoto'] as const) {
    assertThrows(() => validateDriverPhotos({ ...fixture(), [field]: '' }));
    assertThrows(() => validateDriverPhotos({ ...fixture(), [field]: '  ' }));
  }
});
