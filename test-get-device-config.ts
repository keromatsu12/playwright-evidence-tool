import { getDeviceConfig, CUSTOM_DEVICES } from './devices.js';
import assert from 'node:assert';

console.log('Running tests for getDeviceConfig...');

// Mock Playwright devices
const mockPlaywrightDevices = {
  'iPhone 12': { viewport: { width: 390, height: 844 }, userAgent: 'iPhone 12 UA', deviceScaleFactor: 3, isMobile: true, hasTouch: true },
};

try {
  // Test 1: Playwright preset
  console.log('Test 1: Playwright preset (iPhone 12)');
  const iphone12 = getDeviceConfig('iPhone 12', mockPlaywrightDevices);
  assert.ok(iphone12, 'iPhone 12 should be found in Playwright presets');
  assert.strictEqual(iphone12.viewport.width, 390, 'iPhone 12 width should be 390');

  // Test 2: Custom iPhone 16
  console.log('Test 2: Custom iPhone 16');
  const iphone16 = getDeviceConfig('iPhone 16', mockPlaywrightDevices);
  assert.deepStrictEqual(iphone16, CUSTOM_DEVICES['iPhone 16'], 'iPhone 16 should return custom config');

  // Test 3: Custom iPhone 16 Pro Max
  console.log('Test 3: Custom iPhone 16 Pro Max');
  const iphone16ProMax = getDeviceConfig('iPhone 16 Pro Max', mockPlaywrightDevices);
  assert.deepStrictEqual(iphone16ProMax, CUSTOM_DEVICES['iPhone 16 Pro Max'], 'iPhone 16 Pro Max should return custom config');

  // Test 4: iPhone 15 mapping to iPhone 16
  console.log('Test 4: iPhone 15 mapping to iPhone 16');
  const iphone15 = getDeviceConfig('iPhone 15', mockPlaywrightDevices);
  assert.deepStrictEqual(iphone15, CUSTOM_DEVICES['iPhone 16'], 'iPhone 15 should map to iPhone 16');

  // Test 5: iPhone 15 Pro Max mapping to iPhone 16 Pro Max
  console.log('Test 5: iPhone 15 Pro Max mapping to iPhone 16 Pro Max');
  const iphone15ProMax = getDeviceConfig('iPhone 15 Pro Max', mockPlaywrightDevices);
  assert.deepStrictEqual(iphone15ProMax, CUSTOM_DEVICES['iPhone 16 Pro Max'], 'iPhone 15 Pro Max should map to iPhone 16 Pro Max');

  // Test 6: iPhone 15 Plus mapping to iPhone 16 Pro Max
  console.log('Test 6: iPhone 15 Plus mapping to iPhone 16 Pro Max');
  const iphone15Plus = getDeviceConfig('iPhone 15 Plus', mockPlaywrightDevices);
  assert.deepStrictEqual(iphone15Plus, CUSTOM_DEVICES['iPhone 16 Pro Max'], 'iPhone 15 Plus should map to iPhone 16 Pro Max');

  // Test 7: iPhone 16 Pro mapping to iPhone 16
  console.log('Test 7: iPhone 16 Pro mapping to iPhone 16');
  const iphone16Pro = getDeviceConfig('iPhone 16 Pro', mockPlaywrightDevices);
  assert.deepStrictEqual(iphone16Pro, CUSTOM_DEVICES['iPhone 16'], 'iPhone 16 Pro should map to iPhone 16');

  // Test 8: Unknown device
  console.log('Test 8: Unknown device');
  const unknown = getDeviceConfig('Unknown Device', mockPlaywrightDevices);
  assert.strictEqual(unknown, null, 'Unknown device should return null');

  console.log('✅ All tests passed!');
} catch (error) {
  console.error('❌ Test failed!');
  console.error(error);
  process.exit(1);
}
