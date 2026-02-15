import { chromium, devices as playwrightDevices } from 'playwright';
import type { Browser, BrowserContext, Page, DeviceDescriptor } from 'playwright';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { randomInt } from 'node:crypto';
import handler from 'serve-handler';
import { glob } from 'glob';
import { fileURLToPath } from 'node:url';

// --- Configuration ---
const CONCURRENCY_LIMIT = 5; // Max concurrent pages open

// Custom Device Definitions for iPhone 15/16 if not in Playwright
// Explicitly define as DeviceDescriptor to match return type
const CUSTOM_DEVICES: Record<string, DeviceDescriptor> = {
  'iPhone 16': {
    viewport: { width: 393, height: 852 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium',
  },
  'iPhone 16 Pro Max': {
    viewport: { width: 430, height: 932 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1',
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    defaultBrowserType: 'chromium',
  },
};

// Helper to get device config
function getDeviceConfig(deviceName: string): DeviceDescriptor | null {
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

// Target Devices List
const TARGET_DEVICES = [
  'Desktop Chrome',
  'iPhone 12',
  'iPhone 12 Pro',
  'iPhone 12 Pro Max',
  'iPhone 13',
  'iPhone 13 Pro',
  'iPhone 13 Pro Max',
  'iPhone 14',
  'iPhone 14 Pro',
  'iPhone 14 Pro Max',
  // iPhone 15/16 family
  'iPhone 15',
  'iPhone 15 Pro',
  'iPhone 15 Pro Max',
  'iPhone 16',
  'iPhone 16 Pro',
  'iPhone 16 Pro Max',
];

// --- Main Script ---

async function main() {
  const targetDirArg = process.argv[2];

  if (!targetDirArg) {
    console.error('Error: Target directory is required.');
    console.error('Usage: ts-node capture-all.ts <target-directory>');
    process.exit(1);
  }

  const absTargetDir = path.resolve(targetDirArg);

  if (!fs.existsSync(absTargetDir)) {
    console.error(`Error: Target directory does not exist: ${absTargetDir}`);
    process.exit(1);
  }

  console.log(`Target Directory: ${absTargetDir}`);

  // 1. Start Local Server
  const server = http.createServer((request, response) => {
    return handler(request, response, {
      public: absTargetDir,
      cleanUrls: false,
    });
  });

  const port = await startServerWithRetry(server, 3000, 4000, 10);
  const baseUrl = `http://localhost:${port}`;
  console.log(`Server running at ${baseUrl}`);

  try {
    // 2. Find HTML Files
    console.log('Scanning for HTML files...');
    // glob returns Promise<string[]> in v13? Or we use glob.glob
    const files = await glob('**/*.html', { cwd: absTargetDir });

    if (files.length === 0) {
      console.log('No HTML files found.');
      return;
    }

    console.log(`Found ${files.length} HTML files.`);

    // 3. Launch Browser
    const browser = await chromium.launch();

    // 4. Process per Device
    for (const deviceName of TARGET_DEVICES) {
      let deviceConfig: DeviceDescriptor | null | undefined = getDeviceConfig(deviceName);

      if (!deviceConfig && deviceName === 'Desktop Chrome') {
          // Default viewport for Desktop Chrome
          deviceConfig = {
              viewport: { width: 1280, height: 720 },
              userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
              deviceScaleFactor: 1,
              isMobile: false,
              hasTouch: false,
              defaultBrowserType: 'chromium',
          };
      }

      if (!deviceConfig) {
        console.warn(`Warning: Device config for '${deviceName}' not found. Skipping.`);
        continue;
      }

      console.log(`\nProcessing for device: ${deviceName}`);

      const context = await browser.newContext(deviceConfig);

      // Parallel processing of files for this device
      const queue = [...files];

      // Worker function
      const worker = async () => {
          while (queue.length > 0) {
              const file = queue.shift();
              if (file) {
                  await processFile(context, file, deviceName, baseUrl);
              }
          }
      };

      // Create workers
      const workers = [];
      const numWorkers = Math.min(CONCURRENCY_LIMIT, files.length);
      for (let i = 0; i < numWorkers; i++) {
          workers.push(worker());
      }

      await Promise.all(workers);

      await context.close();
    }

    await browser.close();
    console.log('\nAll done!');

  } catch (err) {
    console.error('An error occurred:', err);
  } finally {
    server.close();
  }
}

async function startServerWithRetry(server: http.Server, min: number, max: number, maxRetries: number): Promise<number> {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const port = min + randomInt(max - min + 1);
    try {
      await new Promise<void>((resolve, reject) => {
        const onListening = () => {
          server.removeListener('error', onError);
          resolve();
        };
        const onError = (err: any) => {
          server.removeListener('listening', onListening);
          reject(err);
        };

        server.once('listening', onListening);
        server.once('error', onError);

        server.listen(port);
      });
      return port;
    } catch (err: any) {
      if (err.code === 'EADDRINUSE') {
        console.log(`Port ${port} is in use, retrying...`);
        continue;
      }
      throw err;
    }
  }
  throw new Error(`Could not find a free port after ${maxRetries} attempts.`);
}

async function processFile(context: BrowserContext, file: string, deviceName: string, baseUrl: string) {
  let page: Page | null = null;
  try {
    page = await context.newPage();

    // Construct URL
    // file is relative path from targetDir (e.g., 'sub/index.html')
    // We need to ensure it's URL encoded if necessary.
    // Replace backslashes with forward slashes for URL
    const urlPath = file.split(path.sep).join('/');
    // Encode URI components? Usually file names are safe but spaces need encoding.
    // However, glob returns paths.
    // Let's encode each segment.
    const encodedUrlPath = urlPath.split('/').map(encodeURIComponent).join('/');

    const url = `${baseUrl}/${encodedUrlPath}`;

    // Output path
    // verification/[subdir]/[Device]_[Filename].png
    // If file is "sub/dir/index.html", output is "verification/sub/dir/iPhone16_index.png"

    const fileDir = path.dirname(file);
    const fileName = path.basename(file, '.html');
    // Sanitize device name for filename
    const safeDeviceName = deviceName.replace(/[^a-zA-Z0-9]/g, '');
    const outputFileName = `${safeDeviceName}_${fileName}.png`;

    const outputDir = path.join(process.cwd(), 'verification', fileDir);
    const outputPath = path.join(outputDir, outputFileName);

    // Ensure dir exists
    fs.mkdirSync(outputDir, { recursive: true });

    // Navigate
    await page.goto(url, { waitUntil: 'domcontentloaded' }); // Use domcontentloaded first, then wait for networkidle
    await page.waitForLoadState('networkidle');

    // Screenshot
    await page.screenshot({
      path: outputPath,
      fullPage: true,
    });

    // Relative path for logging
    const relativeOutputPath = path.relative(process.cwd(), outputPath);
    console.log(`[${deviceName}] Saved: ${file} -> ${relativeOutputPath}`);

  } catch (e) {
    console.error(`[${deviceName}] Error capturing ${file}:`, e);
  } finally {
    if (page) await page.close();
  }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  main();
}
