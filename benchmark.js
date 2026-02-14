const fs = require('fs');
const path = require('path');
const { performance } = require('perf_hooks');

const iterations = 10000;
const testDir = path.join(process.cwd(), 'test-mkdir-cache');

function runBenchmark() {
    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }

    console.log(`Running benchmark with ${iterations} iterations...`);

    // Baseline: without cache
    fs.mkdirSync(testDir, { recursive: true });

    const start1 = performance.now();
    for (let i = 0; i < iterations; i++) {
        fs.mkdirSync(testDir, { recursive: true });
    }
    const end1 = performance.now();
    console.log(`mkdirSync without cache: ${(end1 - start1).toFixed(4)}ms`);

    // With cache
    const cache = new Set();
    const start2 = performance.now();
    for (let i = 0; i < iterations; i++) {
        if (!cache.has(testDir)) {
            fs.mkdirSync(testDir, { recursive: true });
            cache.add(testDir);
        }
    }
    const end2 = performance.now();
    console.log(`mkdirSync with cache: ${(end2 - start2).toFixed(4)}ms`);

    if (fs.existsSync(testDir)) {
        fs.rmSync(testDir, { recursive: true, force: true });
    }
}

runBenchmark();
