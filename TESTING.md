# Testing Guide

This guide covers the various test scripts available for Twitch Backup.

## Test Scripts Overview

### 1. Mock Tests (Unit/Structure Tests)
```bash
npm test
# or
npm run test:quick  # Skip TypeScript compilation test
```

Tests without requiring external dependencies:
- Project structure validation
- TypeScript compilation check
- Configuration files existence
- Component structure verification
- API function definitions

### 2. Application Test (Integration Test)
```bash
npm run test:app
# or
npm run test:app -- --dev  # Also launches the app
```

Interactive test that:
- Checks system dependencies (yt-dlp)
- Tests Twitch API connection (optional)
- Tests download functionality
- Launches app in dev mode (with --dev flag)

### 3. End-to-End Tests
```bash
npm run test:e2e
```

Automated Electron app tests:
- Window creation and sizing
- IPC communication
- Configuration persistence  
- React app loading
- Navigation between tabs
- Store functionality

**Note**: E2E tests require the app to be built first.

### 4. Screenshot Tests (Visual Regression)
```bash
npm run test:screenshots
# or
npm run test:screenshots:update  # Update baseline images
```

Automated visual testing that:
- Captures screenshots of all major views
- Compares against baseline images
- Detects visual regressions
- Generates HTML report with comparisons
- Creates diff images showing changes

See [Screenshot Testing Guide](docs/SCREENSHOT-TESTING.md) for details.

## Running Tests

### Quick Validation
```bash
# Check project structure and code
npm test
```

### Before Building
```bash
# Check all dependencies
npm run check-deps

# Run mock tests
npm test
```

### After Building
```bash
# Build the app first
npm run build

# Run E2E tests
npm run test:e2e
```

### Manual Testing
```bash
# Interactive test with API
npm run test:app

# Also launch the app
npm run test:app -- --dev
```

## Test Requirements

### For Mock Tests
- Node.js 16+
- npm dependencies installed

### For App Tests  
- yt-dlp installed
- (Optional) Twitch API credentials
- (Optional) Test VOD URL

### For E2E Tests
- App must be built (`npm run build`)
- Display server (headless mode not supported)

## Creating Test Credentials

1. Go to https://dev.twitch.tv/console/apps
2. Click "Register Your Application"
3. Fill in:
   - Name: "Twitch VOD Downloader Test"
   - OAuth Redirect URLs: `http://localhost`
   - Category: "Application Integration"
4. Save your Client ID and Client Secret

## Test VOD URLs

For testing downloads, you can use:
- Any public Twitch VOD URL
- Format: `https://www.twitch.tv/videos/1234567890`
- The test script limits downloads to 50MB

## Continuous Integration

For CI/CD pipelines:

```yaml
# Example GitHub Actions
- name: Install dependencies
  run: npm ci
  
- name: Check dependencies
  run: npm run check-deps
  
- name: Run tests
  run: npm test
  
- name: Build app
  run: npm run build
  
- name: Run E2E tests
  run: xvfb-run -a npm run test:e2e  # Linux needs xvfb
```

## Troubleshooting

### TypeScript compilation test fails
- Run `npm run build:main` to see detailed errors
- Check for type errors in your code

### E2E tests fail to start
- Ensure app is built: `npm run build`
- Check if dist/renderer/index.html exists
- On Linux, install xvfb for headless testing

### API tests fail
- Verify your Twitch credentials are correct
- Check if you've hit API rate limits
- Ensure internet connection is available

### Download tests fail
- Verify yt-dlp is installed: `yt-dlp --version`
- Check if the VOD URL is valid and public
- Ensure you have write permissions to test directory

## Adding New Tests

To add tests to `test-mock.js`:

```javascript
test('Your test name', () => {
  // Your test logic
  assert(condition, 'Error message if fails');
});
```

To add E2E tests to `test-e2e.js`:

```javascript
{
  name: 'Your E2E test',
  fn: async () => {
    // Test IPC calls or UI interactions
    const result = await testIPC('your-channel');
    if (!result) throw new Error('Test failed');
  }
}
```