# Playwright Evidence Tool

[日本語版 (Japanese)](./README_ja.md)

This tool automates the capture of **full-page screenshots** for all HTML files in a directory across multiple device layouts (Desktop, Tablet, Mobile).

## 1. Installation

Execute the following commands to install the required packages and browsers.

```bash
# Initialize project (if not already done)
npm init -y

# Install dependencies
npm install typescript ts-node playwright @types/node glob serve-handler

# Install Playwright browsers
npx playwright install chromium
```

## 2. Usage

### Basic Command

The script requires a target directory as an argument.

```bash
# Run with 'npx ts-node'
npx ts-node capture-all.ts ./path/to/your/html/files
```

Example:
```bash
npx ts-node capture-all.ts ./dist
```

### Output

Screenshots are saved in the `verification` directory in the project root.
The directory structure of the target is preserved.

Example:
If target is `./dist`:
- `./dist/index.html` -> `./verification/iPhone16_index.png`
- `./dist/about/company.html` -> `./verification/about/iPhone16_company.png`

### Changing the Target Directory

Simply change the argument passed to the command.

```bash
# Target 'src' directory
npx ts-node capture-all.ts ./src

# Target 'public' directory
npx ts-node capture-all.ts ./public
```

### Running with Sample Data

This repository includes a sample target directory (`sample-target`) and its generated output (`verification`) for demonstration purposes.

```bash
# Run against the included sample
npx ts-node capture-all.ts sample-target
```

Check the `verification` folder to see the results.

## 3. Features

- **Recursive Search**: Automatically finds all `.html` files in the target directory and subdirectories.
- **Local Server**: Starts a temporary local server (on a random port between 3000-4000) to ensure assets (CSS, JS, Images) load correctly using `http://localhost`.
- **Full Page Screenshots**: Captures the entire scrollable height of the page, not just the viewport.
- **Smart Loading Wait**: Waits for `domcontentloaded` and network activity to settle (`networkidle`) before capturing, ensuring dynamic content is rendered.
- **Device Support**:
  - **PC**: Desktop Chrome (1280x720)
  - **iPhone**: 12, 13, 14, 15, 16 (including Pro/Max variants)
  - **Custom Viewports**: Applies custom viewports for newer devices (e.g., iPhone 16 family) if not natively available in your Playwright version.
- **Concurrency Control**: Limits the number of parallel tabs (default: 5) to prevent memory issues.
- **Error Handling**: Continues processing other files even if one fails.

## 4. Customization

### Adjusting Concurrency
To change the number of concurrent tabs (default is 5), edit `capture-all.ts`:

```typescript
const CONCURRENCY_LIMIT = 5; // Change this value
```

### Adding Devices
To add more devices, modify the `TARGET_DEVICES` array or `CUSTOM_DEVICES` object in `capture-all.ts`.
