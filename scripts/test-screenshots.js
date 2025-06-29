const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// Screenshot test for visual regression
console.log('📸 Starting screenshot tests...');

let mainWindow;
const screenshotsDir = path.join(__dirname, '../test-screenshots');
const baselineDir = path.join(screenshotsDir, 'baseline');
const currentDir = path.join(screenshotsDir, 'current');
const diffDir = path.join(screenshotsDir, 'diff');

// Create directories
[screenshotsDir, baselineDir, currentDir, diffDir].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Override app paths for testing
app.setPath('userData', path.join(__dirname, '../test-userdata'));

// Test utilities
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function captureScreenshot(name) {
  const image = await mainWindow.capturePage();
  const buffer = image.toPNG();
  const filePath = path.join(currentDir, `${name}.png`);
  fs.writeFileSync(filePath, buffer);
  return filePath;
}

async function navigateToTab(tabIndex) {
  await mainWindow.webContents.executeJavaScript(`
    document.querySelectorAll('.tab')[${tabIndex}]?.click()
  `);
  await wait(500); // Wait for transition
}

async function compareImages(name) {
  const baselinePath = path.join(baselineDir, `${name}.png`);
  const currentPath = path.join(currentDir, `${name}.png`);
  
  // If no baseline exists, create it
  if (!fs.existsSync(baselinePath)) {
    fs.copyFileSync(currentPath, baselinePath);
    return { isNew: true, differs: false };
  }
  
  // Try to use advanced comparison if available
  try {
    const { compareImages: advancedCompare } = require('./compare-images');
    const diffPath = path.join(diffDir, `${name}.png`);
    const result = await advancedCompare(baselinePath, currentPath, diffPath);
    
    return {
      isNew: false,
      differs: !result.identical,
      percentDiff: result.percentDiff,
      pixelsDiff: result.pixelsDiff,
      advanced: true
    };
  } catch (e) {
    // Fallback to simple size comparison
    const baselineStats = fs.statSync(baselinePath);
    const currentStats = fs.statSync(currentPath);
    
    // Check if file sizes differ significantly (>5% difference)
    const sizeDiff = Math.abs(baselineStats.size - currentStats.size) / baselineStats.size;
    const differs = sizeDiff > 0.05;
    
    return { isNew: false, differs, sizeDiff: (sizeDiff * 100).toFixed(2), advanced: false };
  }
}

// Screenshot test cases
const screenshots = [
  {
    name: '01-initial-load',
    description: 'Initial app load - Search tab',
    setup: async () => {
      // Just wait for initial load
      await wait(1000);
    }
  },
  {
    name: '02-search-empty',
    description: 'Search tab with no results',
    setup: async () => {
      await navigateToTab(0);
    }
  },
  {
    name: '03-downloads-empty',
    description: 'Downloads tab with no downloads',
    setup: async () => {
      await navigateToTab(1);
    }
  },
  {
    name: '04-scheduled-empty',
    description: 'Scheduled tab with no tasks',
    setup: async () => {
      await navigateToTab(2);
    }
  },
  {
    name: '05-settings',
    description: 'Settings tab',
    setup: async () => {
      await navigateToTab(3);
    }
  },
  {
    name: '06-search-typing',
    description: 'Search tab with text input',
    setup: async () => {
      await navigateToTab(0);
      await mainWindow.webContents.executeJavaScript(`
        const input = document.querySelector('.search-input');
        if (input) {
          input.value = 'test streamer';
          input.dispatchEvent(new Event('input', { bubbles: true }));
        }
      `);
      await wait(500);
    }
  },
  {
    name: '07-scheduled-form',
    description: 'Scheduled tasks with add form open',
    setup: async () => {
      await navigateToTab(2);
      await mainWindow.webContents.executeJavaScript(`
        document.querySelector('.primary')?.click();
      `);
      await wait(300);
    }
  },
  {
    name: '08-window-resized',
    description: 'Window resized to minimum',
    setup: async () => {
      mainWindow.setSize(800, 600);
      await wait(500);
      await navigateToTab(0);
    },
    cleanup: async () => {
      mainWindow.setSize(1200, 800);
    }
  }
];

// Run screenshot tests
async function runTests() {
  console.log('Waiting for app to be ready...\n');
  
  await app.whenReady();
  
  // Create window
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, '../dist/main/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    show: false, // Don't show window during tests
    webSecurity: false // Allow loading local files
  });

  // Load the app
  const indexPath = path.join(__dirname, '../dist/renderer/index.html');
  if (fs.existsSync(indexPath)) {
    await mainWindow.loadFile(indexPath);
  } else {
    console.error('❌ Built app not found. Run "npm run build" first.');
    app.quit();
    return;
  }

  // Wait for content to load
  await wait(2000);

  // Disable animations for consistent screenshots
  await mainWindow.webContents.executeJavaScript(`
    const style = document.createElement('style');
    style.textContent = '* { transition: none !important; animation: none !important; }';
    document.head.appendChild(style);
  `);

  console.log(`📸 Taking ${screenshots.length} screenshots...\n`);

  const results = [];
  
  // Run each screenshot test
  for (let i = 0; i < screenshots.length; i++) {
    const test = screenshots[i];
    process.stdout.write(`[${i + 1}/${screenshots.length}] ${test.description}...`);
    
    try {
      // Setup
      if (test.setup) {
        await test.setup();
      }
      
      // Capture screenshot
      const filePath = await captureScreenshot(test.name);
      
      // Compare with baseline
      const comparison = await compareImages(test.name);
      
      if (comparison.isNew) {
        process.stdout.write(' 🆕 (baseline created)\n');
        results.push({ ...test, status: 'new' });
      } else if (comparison.differs) {
        const diffText = comparison.advanced 
          ? `${comparison.percentDiff}% pixels`
          : `${comparison.sizeDiff}% size`;
        process.stdout.write(` ⚠️  (${diffText} difference)\n`);
        results.push({ ...test, status: 'changed', diff: diffText, comparison });
      } else {
        process.stdout.write(' ✅\n');
        results.push({ ...test, status: 'unchanged' });
      }
      
      // Cleanup
      if (test.cleanup) {
        await test.cleanup();
      }
    } catch (error) {
      process.stdout.write(' ❌\n');
      console.error(`   ${error.message}`);
      results.push({ ...test, status: 'error', error: error.message });
    }
  }

  // Generate HTML report
  generateReport(results);

  // Clean up test data
  try {
    fs.rmSync(path.join(__dirname, '../test-userdata'), { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }

  // Summary
  console.log('\n📊 Screenshot Test Results:');
  const unchanged = results.filter(r => r.status === 'unchanged').length;
  const changed = results.filter(r => r.status === 'changed').length;
  const newScreens = results.filter(r => r.status === 'new').length;
  const errors = results.filter(r => r.status === 'error').length;
  
  console.log(`   ✅ Unchanged: ${unchanged}`);
  console.log(`   ⚠️  Changed: ${changed}`);
  console.log(`   🆕 New: ${newScreens}`);
  console.log(`   ❌ Errors: ${errors}`);
  
  console.log(`\n📄 Report generated: ${path.join(screenshotsDir, 'report.html')}`);
  
  if (changed > 0) {
    console.log('\n⚠️  Visual changes detected!');
    console.log('   Run "npm run test:screenshots -- --update" to update baselines');
  }
  
  // Update baselines if requested
  if (process.argv.includes('--update')) {
    console.log('\n📸 Updating baselines...');
    results.filter(r => r.status === 'changed').forEach(r => {
      const currentPath = path.join(currentDir, `${r.name}.png`);
      const baselinePath = path.join(baselineDir, `${r.name}.png`);
      fs.copyFileSync(currentPath, baselinePath);
      console.log(`   Updated: ${r.name}`);
    });
  }
  
  app.exit(errors > 0 ? 1 : 0);
}

// Generate HTML report
function generateReport(results) {
  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Screenshot Test Report</title>
  <style>
    body { 
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      margin: 0;
      padding: 20px;
      background: #f5f5f5;
    }
    h1 { color: #333; }
    .container { max-width: 1200px; margin: 0 auto; }
    .test { 
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .test-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 10px;
    }
    .test-name { font-weight: bold; font-size: 18px; }
    .status { 
      padding: 4px 12px;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
    }
    .status.unchanged { background: #d4edda; color: #155724; }
    .status.changed { background: #fff3cd; color: #856404; }
    .status.new { background: #cce5ff; color: #004085; }
    .status.error { background: #f8d7da; color: #721c24; }
    .screenshots {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
      gap: 20px;
      margin-top: 15px;
    }
    .screenshot {
      text-align: center;
    }
    .screenshot img {
      max-width: 100%;
      border: 1px solid #ddd;
      border-radius: 4px;
    }
    .screenshot-label {
      margin-top: 5px;
      font-size: 14px;
      color: #666;
    }
    .summary {
      background: white;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 30px;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
    }
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 20px;
      margin-top: 15px;
    }
    .summary-item {
      text-align: center;
    }
    .summary-number {
      font-size: 32px;
      font-weight: bold;
      margin-bottom: 5px;
    }
    .summary-label {
      color: #666;
      font-size: 14px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>📸 Screenshot Test Report</h1>
    <div class="summary">
      <h2>Summary</h2>
      <div class="summary-grid">
        <div class="summary-item">
          <div class="summary-number" style="color: #28a745;">${results.filter(r => r.status === 'unchanged').length}</div>
          <div class="summary-label">Unchanged</div>
        </div>
        <div class="summary-item">
          <div class="summary-number" style="color: #ffc107;">${results.filter(r => r.status === 'changed').length}</div>
          <div class="summary-label">Changed</div>
        </div>
        <div class="summary-item">
          <div class="summary-number" style="color: #007bff;">${results.filter(r => r.status === 'new').length}</div>
          <div class="summary-label">New</div>
        </div>
        <div class="summary-item">
          <div class="summary-number" style="color: #dc3545;">${results.filter(r => r.status === 'error').length}</div>
          <div class="summary-label">Errors</div>
        </div>
      </div>
    </div>
    ${results.map(result => `
      <div class="test">
        <div class="test-header">
          <div>
            <div class="test-name">${result.name}</div>
            <div style="color: #666; margin-top: 5px;">${result.description}</div>
          </div>
          <div class="status ${result.status}">
            ${result.status.toUpperCase()}
            ${result.diff ? `(${result.diff}% diff)` : ''}
          </div>
        </div>
        ${result.status !== 'error' ? `
          <div class="screenshots">
            ${fs.existsSync(path.join(baselineDir, `${result.name}.png`)) && result.status === 'changed' ? `
              <div class="screenshot">
                <img src="baseline/${result.name}.png" alt="Baseline">
                <div class="screenshot-label">Baseline</div>
              </div>
            ` : ''}
            <div class="screenshot">
              <img src="current/${result.name}.png" alt="Current">
              <div class="screenshot-label">Current</div>
            </div>
          </div>
        ` : `
          <div style="color: #dc3545; margin-top: 10px;">
            Error: ${result.error || 'Unknown error'}
          </div>
        `}
      </div>
    `).join('')}
    <div style="text-align: center; margin-top: 40px; color: #666;">
      Generated on ${new Date().toLocaleString()}
    </div>
  </div>
</body>
</html>
  `;
  
  fs.writeFileSync(path.join(screenshotsDir, 'report.html'), html);
}

// Handle errors
app.on('window-all-closed', () => {
  app.quit();
});

process.on('uncaughtException', (error) => {
  console.error('\n❌ Uncaught error:', error);
  app.exit(1);
});

// Start tests
runTests().catch(error => {
  console.error('\n❌ Test runner failed:', error);
  app.exit(1);
});