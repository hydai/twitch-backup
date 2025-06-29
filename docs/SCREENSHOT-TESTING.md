# Screenshot Testing Guide

Automated visual regression testing for the Twitch Backup UI.

## Overview

Screenshot tests capture the visual state of the application across different views and compare them against baseline images to detect unintended visual changes.

## Running Screenshot Tests

### Basic Usage
```bash
# Run screenshot tests
npm run test:screenshots

# Update baselines when changes are intentional
npm run test:screenshots:update
```

### Test Output
- **Screenshots**: `test-screenshots/`
  - `baseline/` - Reference images
  - `current/` - Current test run
  - `diff/` - Difference images (when using canvas)
- **Report**: `test-screenshots/report.html`

## Test Scenarios

The test suite captures 8 key states:

1. **Initial Load** - App startup state
2. **Search Empty** - Search tab with no input
3. **Downloads Empty** - Empty download queue
4. **Scheduled Empty** - No scheduled tasks
5. **Settings** - Settings page
6. **Search Typing** - Search with input text
7. **Scheduled Form** - Add task form open
8. **Window Resized** - Minimum window size

## Image Comparison

### Advanced Mode (with canvas)
```bash
# Install canvas for pixel-perfect comparison
npm install canvas

# Compare images manually
npm run compare-images -- image1.png image2.png diff.png
```

Features:
- Pixel-by-pixel comparison
- Configurable threshold (default: 5)
- Visual diff generation
- Percentage difference calculation

### Basic Mode (fallback)
- Binary file comparison
- File size difference check
- Works without additional dependencies

## Understanding Results

### Status Indicators
- 🆕 **New** - No baseline exists (first run)
- ✅ **Unchanged** - Matches baseline
- ⚠️ **Changed** - Visual differences detected
- ❌ **Error** - Test failed to execute

### HTML Report
Open `test-screenshots/report.html` to:
- View all screenshots side-by-side
- See percentage differences
- Compare baseline vs current
- Review test summary

## Best Practices

### 1. Consistent Environment
- Run tests on the same OS/resolution
- Ensure fonts are consistent
- Disable animations during tests

### 2. Updating Baselines
Only update baselines when:
- UI changes are intentional
- New features are added
- Design updates are made

```bash
# Review changes first
npm run test:screenshots

# If changes are correct
npm run test:screenshots:update
```

### 3. CI/CD Integration
```yaml
# GitHub Actions example
- name: Run screenshot tests
  run: |
    npm run build
    xvfb-run -a npm run test:screenshots
  
- name: Upload screenshots
  if: failure()
  uses: actions/upload-artifact@v3
  with:
    name: screenshot-test-results
    path: test-screenshots/
```

## Troubleshooting

### Tests fail on CI
- Different OS renders fonts differently
- Use OS-specific baselines
- Consider tolerance thresholds

### High percentage differences
- Check for animations
- Verify window size
- Look for dynamic content

### Canvas module issues
```bash
# macOS
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Ubuntu/Debian  
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev

# Then reinstall
npm install canvas
```

## Advanced Usage

### Custom Screenshots
Add new test cases to `test-screenshots.js`:

```javascript
{
  name: 'my-custom-test',
  description: 'Custom test scenario',
  setup: async () => {
    // Navigate or interact with UI
    await navigateToTab(0);
    // Add custom interactions
  },
  cleanup: async () => {
    // Reset state if needed
  }
}
```

### Selective Testing
Modify the test script to run specific tests:

```javascript
// In test-screenshots.js
const screenshots = [
  // Comment out tests to skip
  // Or add conditional logic
].filter(test => !process.argv.includes('--quick') || test.quick);
```

### Cross-Platform Baselines
Organize baselines by platform:

```
test-screenshots/
  baseline/
    darwin/  # macOS
    win32/   # Windows
    linux/   # Linux
```

## Benefits

1. **Catch Visual Regressions** - Detect unintended UI changes
2. **Document UI States** - Visual documentation of app states
3. **Cross-Platform Validation** - Ensure consistency across OS
4. **Design Review** - Easy before/after comparison
5. **Automated Testing** - No manual visual inspection needed