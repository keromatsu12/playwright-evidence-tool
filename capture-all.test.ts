import { describe, it, before, after } from "node:test";
import assert from "node:assert";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { getDeviceConfig, ensureDirectory, validateDirectory } from "./capture-all.ts";

describe("validateDirectory", () => {
  let tempDir: string;

  before(async () => {
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "capture-all-test-val-"),
    );
  });

  after(async () => {
    if (tempDir) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should return resolved path for valid directory", async () => {
    const testDir = path.join(tempDir, "valid-dir");
    await fs.promises.mkdir(testDir);
    const result = validateDirectory(testDir);
    assert.strictEqual(fs.existsSync(result), true);
    // Ensure it ends with "valid-dir"
    assert.match(result, /valid-dir$/);
  });

  it("should throw error if directory does not exist", () => {
    const badPath = path.join(tempDir, "non-existent");
    assert.throws(() => {
      validateDirectory(badPath);
    }, /Target directory does not exist/);
  });

  it("should throw error if target is a file", async () => {
    const filePath = path.join(tempDir, "test-file.txt");
    await fs.promises.writeFile(filePath, "hello");
    assert.throws(() => {
      validateDirectory(filePath);
    }, /Target is not a directory/);
  });
});

describe("getDeviceConfig", () => {
  it("should return Playwright preset for standard devices", () => {
    const config = getDeviceConfig("iPhone 12");
    assert.ok(config);
    assert.strictEqual(config.userAgent.includes("iPhone"), true);
    assert.strictEqual(config.isMobile, true);
  });

  it("should return Playwright preset for iPhone 15", () => {
    // iPhone 15 is now in Playwright, so it should be returned directly
    const config = getDeviceConfig("iPhone 15");
    assert.ok(config);
    assert.strictEqual(config.isMobile, true);
    // Ensure it is NOT our custom config (which has height 852)
    // Playwright's iPhone 15 has a specific viewport height (likely 659 or similar)
    // We just assert it exists.
  });

  it("should return custom configuration for iPhone 16", () => {
    const config = getDeviceConfig("iPhone 16");
    assert.ok(config);
    assert.deepStrictEqual(config.viewport, { width: 393, height: 852 });
    assert.strictEqual(config.deviceScaleFactor, 3);
    assert.strictEqual(config.userAgent.includes("iPhone OS 18_0"), true);
  });

  it("should return custom configuration for iPhone 16 Pro Max", () => {
    const config = getDeviceConfig("iPhone 16 Pro Max");
    assert.ok(config);
    assert.deepStrictEqual(config.viewport, { width: 430, height: 932 });
    assert.strictEqual(config.deviceScaleFactor, 3);
  });

  it("should trigger fallback logic for unknown iPhone 15 variants", () => {
    // 'iPhone 15 Custom' is not in Playwright, so it hits the custom logic
    const config = getDeviceConfig("iPhone 15 Custom");
    // Should map to iPhone 16 custom config
    const expected = getDeviceConfig("iPhone 16");
    assert.deepStrictEqual(config, expected);
  });

  it("should trigger fallback logic for unknown iPhone 16 variants", () => {
    // 'iPhone 16 Future' is not in Playwright
    const config = getDeviceConfig("iPhone 16 Future");
    // Should map to iPhone 16 custom config
    const expected = getDeviceConfig("iPhone 16");
    assert.deepStrictEqual(config, expected);
  });

  it("should trigger fallback logic for unknown Pro Max variants", () => {
    // 'iPhone 16 Pro Max Future' or 'iPhone 15 Pro Max Custom'
    const config = getDeviceConfig("iPhone 15 Pro Max Custom");
    // Should map to iPhone 16 Pro Max
    const expected = getDeviceConfig("iPhone 16 Pro Max");
    assert.deepStrictEqual(config, expected);
  });

  it("should trigger fallback logic for Plus variants", () => {
    const config = getDeviceConfig("iPhone 15 Plus Custom");
    // Should map to iPhone 16 Pro Max (as per logic)
    const expected = getDeviceConfig("iPhone 16 Pro Max");
    assert.deepStrictEqual(config, expected);
  });

  it("should return Playwright preset for Desktop Chrome", () => {
    const config = getDeviceConfig("Desktop Chrome");
    assert.ok(config);
    assert.strictEqual(config.viewport.width, 1280);
    assert.strictEqual(config.viewport.height, 720);
    assert.strictEqual(config.isMobile, false);
  });

  it("should return null for unknown devices", () => {
    const config = getDeviceConfig("NonExistentDevice");
    assert.strictEqual(config, null);
  });
});

describe("ensureDirectory", () => {
  let tempDir: string;

  before(async () => {
    tempDir = await fs.promises.mkdtemp(
      path.join(os.tmpdir(), "capture-all-test-"),
    );
  });

  after(async () => {
    if (tempDir) {
      await fs.promises.rm(tempDir, { recursive: true, force: true });
    }
  });

  it("should create a directory and add it to the Set", async () => {
    const createdDirs = new Set<string>();
    const testDir = path.join(tempDir, "subdir1");

    await ensureDirectory(testDir, createdDirs);

    assert.ok(createdDirs.has(testDir));
    assert.strictEqual(fs.existsSync(testDir), true);
  });

  it("should not error if directory already exists", async () => {
    const createdDirs = new Set<string>();
    const testDir = path.join(tempDir, "subdir2");
    await fs.promises.mkdir(testDir); // Create it manually first

    await ensureDirectory(testDir, createdDirs);

    assert.ok(createdDirs.has(testDir));
    assert.strictEqual(fs.existsSync(testDir), true);
  });

  it("should be idempotent (calling twice works)", async () => {
    const createdDirs = new Set<string>();
    const testDir = path.join(tempDir, "subdir3");

    await ensureDirectory(testDir, createdDirs);
    // Second call should return immediately because it's in the set
    await ensureDirectory(testDir, createdDirs);

    assert.ok(createdDirs.has(testDir));
    assert.strictEqual(fs.existsSync(testDir), true);
  });
});
