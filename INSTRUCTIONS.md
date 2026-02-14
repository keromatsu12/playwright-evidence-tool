# Playwright Evidence Tool Instructions

This tool automates the capture of screenshots for all HTML files in a directory across multiple device layouts.

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

## 3. Features

- **Recursive Search**: Automatically finds all `.html` files in the target directory and subdirectories.
- **Local Server**: Starts a temporary local server to ensure assets (CSS, JS, Images) load correctly using `http://localhost`.
- **Device Support**:
  - PC (Desktop Chrome)
  - iPhone 12, 13, 14 (Pro/Max variants included)
  - iPhone 15, 16 (Custom viewports applied if not available in Playwright)
- **Concurrency Control**: Limits the number of parallel tabs (default: 5) to prevent memory issues.
- **Error Handling**: Continues processing other files even if one fails.

## 4. Customization

### Adjusting Concurrency
To change the number of concurrent tabs (default is 5), edit `capture-all.ts`:

```typescript
const CONCURRENCY_LIMIT = 5; // Change this value
```

### Adding Devices
To add more devices, modify `TARGET_DEVICES` array or `CUSTOM_DEVICES` object in `capture-all.ts`.
