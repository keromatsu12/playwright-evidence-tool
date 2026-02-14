// --- Device Definitions ---
export type DeviceConfig = {
  viewport: { width: number; height: number };
  userAgent: string;
  deviceScaleFactor: number;
  isMobile: boolean;
  hasTouch: boolean;
};

// Custom Device Definitions for iPhone 15/16 if not in Playwright
export const CUSTOM_DEVICES: Record<string, DeviceConfig> = {
  'iPhone 16': {
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
  'iPhone 16 Pro Max': {
    viewport: { width: 430, height: 932 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  },
};

/**
 * Helper to get device config.
 * @param deviceName Name of the device
 * @param playwrightDevices Optional playwright devices preset (for dependency injection)
 */
export function getDeviceConfig(deviceName: string, playwrightDevices: Record<string, any> = {}): any {
  // 1. Check Playwright presets
  const preset = playwrightDevices[deviceName];
  if (preset) return preset;

  // 2. Check Custom Definitions
  // Map requirement names to potential keys
  if (deviceName.includes('iPhone 15') || deviceName.includes('iPhone 16')) {
     if (deviceName.includes('Pro Max') || deviceName.includes('Plus')) {
         return CUSTOM_DEVICES['iPhone 16 Pro Max'];
     }
     return CUSTOM_DEVICES['iPhone 16'];
  }

  return null;
}
