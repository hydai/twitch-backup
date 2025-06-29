const { app, BrowserWindow } = require('electron');
const path = require('path');
const fs = require('fs');

// E2E Test for Electron app
console.log('🧪 Starting E2E tests...');

let mainWindow;
let testsPassed = 0;
let testsFailed = 0;

// Override app paths for testing
app.setPath('userData', path.join(__dirname, '../test-userdata'));
app.setPath('downloads', path.join(__dirname, '../test-downloads'));

// Test utilities
async function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testIPC(channel, ...args) {
  return mainWindow.webContents.executeJavaScript(`
    window.electronAPI.invoke('${channel}', ${args.map(a => JSON.stringify(a)).join(', ')})
  `);
}

// Tests
const tests = [
  {
    name: 'Window creation',
    fn: async () => {
      if (!mainWindow || mainWindow.isDestroyed()) {
        throw new Error('Main window not created');
      }
      const bounds = mainWindow.getBounds();
      if (bounds.width < 800 || bounds.height < 600) {
        throw new Error('Window size incorrect');
      }
    }
  },
  {
    name: 'IPC: Get config',
    fn: async () => {
      const config = await testIPC('get-config');
      if (!config || typeof config !== 'object') {
        throw new Error('Config not returned');
      }
      if (!config.hasOwnProperty('downloadPath')) {
        throw new Error('Config missing required fields');
      }
    }
  },
  {
    name: 'IPC: Save config',
    fn: async () => {
      const testValue = Math.random();
      await testIPC('save-config', { maxConcurrentDownloads: testValue });
      const config = await testIPC('get-config');
      if (config.maxConcurrentDownloads !== testValue) {
        throw new Error('Config not saved correctly');
      }
    }
  },
  {
    name: 'IPC: Check yt-dlp',
    fn: async () => {
      const result = await testIPC('check-ytdlp');
      console.log(`   yt-dlp installed: ${result}`);
    }
  },
  {
    name: 'Store persistence',
    fn: async () => {
      const storePath = path.join(app.getPath('userData'), 'config.json');
      if (!fs.existsSync(storePath)) {
        throw new Error('Store file not created');
      }
    }
  },
  {
    name: 'React app loaded',
    fn: async () => {
      const title = await mainWindow.webContents.executeJavaScript(
        'document.querySelector("h1")?.textContent'
      );
      if (!title || !title.includes('Twitch VOD Downloader')) {
        throw new Error('React app not loaded correctly');
      }
    }
  },
  {
    name: 'Navigation works',
    fn: async () => {
      // Click on Settings tab
      await mainWindow.webContents.executeJavaScript(`
        document.querySelector('.tab:last-child')?.click()
      `);
      await wait(500);
      
      // Check if settings loaded
      const hasSettings = await mainWindow.webContents.executeJavaScript(`
        document.querySelector('.settings') !== null
      `);
      if (!hasSettings) {
        throw new Error('Navigation to settings failed');
      }
    }
  }
];

// Run tests
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
    show: false // Don't show window during tests
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
  await wait(1000);

  // Run each test
  for (let i = 0; i < tests.length; i++) {
    const test = tests[i];
    process.stdout.write(`[${i + 1}/${tests.length}] ${test.name}...`);
    
    try {
      await test.fn();
      process.stdout.write(' ✅\n');
      testsPassed++;
    } catch (error) {
      process.stdout.write(' ❌\n');
      console.error(`   ${error.message}`);
      testsFailed++;
    }
  }

  // Clean up
  console.log('\nCleaning up test data...');
  try {
    fs.rmSync(path.join(__dirname, '../test-userdata'), { recursive: true, force: true });
    fs.rmSync(path.join(__dirname, '../test-downloads'), { recursive: true, force: true });
  } catch (e) {
    // Ignore cleanup errors
  }

  // Summary
  console.log('\n📊 E2E Test Results:');
  console.log(`   ✅ Passed: ${testsPassed}`);
  console.log(`   ❌ Failed: ${testsFailed}`);
  console.log(`   📋 Total: ${tests.length}`);
  
  if (testsFailed > 0) {
    console.log('\n🔴 Some tests failed!');
    app.exit(1);
  } else {
    console.log('\n✨ All E2E tests passed!');
    app.exit(0);
  }
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