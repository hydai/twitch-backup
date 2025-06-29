const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

console.log('🧪 Twitch Backup - Mock Test Suite');
console.log('=========================================\n');

// Test utilities
const tests = [];
let testCount = 0;

function test(name, fn) {
  tests.push({ name, fn });
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

// Tests
test('Project structure exists', () => {
  const requiredDirs = [
    'src/main',
    'src/renderer', 
    'src/shared',
    'scripts',
    'build'
  ];
  
  requiredDirs.forEach(dir => {
    const fullPath = path.join(__dirname, '..', dir);
    assert(fs.existsSync(fullPath), `Directory ${dir} should exist`);
  });
});

test('TypeScript files compile', async () => {
  return new Promise((resolve, reject) => {
    const tsc = spawn('npx', ['tsc', '--noEmit'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'pipe'
    });
    
    let stderr = '';
    tsc.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    tsc.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`TypeScript compilation failed:\n${stderr}`));
      } else {
        resolve();
      }
    });
  });
});

test('Package.json is valid', () => {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  assert(packageJson.name === 'twitch-backup', 'Package name should match');
  assert(packageJson.main, 'Main entry point should be defined');
  assert(packageJson.scripts.dev, 'Dev script should exist');
  assert(packageJson.scripts.build, 'Build script should exist');
});

test('Required dependencies installed', () => {
  const packagePath = path.join(__dirname, '..', 'package.json');
  const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf-8'));
  
  const requiredDeps = [
    'electron',
    'react',
    'react-dom',
    'axios',
    'zustand',
    'electron-store'
  ];
  
  const allDeps = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies
  };
  
  requiredDeps.forEach(dep => {
    assert(allDeps[dep], `Dependency ${dep} should be installed`);
  });
});

test('Build configuration exists', () => {
  const configs = [
    'tsconfig.json',
    'tsconfig.main.json',
    'vite.config.ts',
    'electron-builder.yml'
  ];
  
  configs.forEach(config => {
    const fullPath = path.join(__dirname, '..', config);
    assert(fs.existsSync(fullPath), `Config file ${config} should exist`);
  });
});

test('Icon files exist', () => {
  const iconPath = path.join(__dirname, '..', 'build', 'icon.svg');
  assert(fs.existsSync(iconPath), 'Icon SVG should exist');
});

test('IPC channels defined', () => {
  const typesPath = path.join(__dirname, '..', 'src', 'shared', 'types.ts');
  const typesContent = fs.readFileSync(typesPath, 'utf-8');
  
  const channels = [
    'get-config',
    'save-config',
    'search-streamer',
    'get-vods',
    'download-vod'
  ];
  
  channels.forEach(channel => {
    assert(typesContent.includes(channel), `IPC channel '${channel}' should be defined`);
  });
});

test('Store schema valid', () => {
  const storePath = path.join(__dirname, '..', 'src', 'main', 'store.ts');
  const storeContent = fs.readFileSync(storePath, 'utf-8');
  
  assert(storeContent.includes('StoreSchema'), 'Store schema should be defined');
  assert(storeContent.includes('encryptionKey'), 'Encryption should be enabled');
});

test('React components exist', () => {
  const components = [
    'MainLayout',
    'StreamerSearch',
    'VODList',
    'DownloadQueue',
    'ScheduledTasks',
    'Settings'
  ];
  
  components.forEach(component => {
    const componentPath = path.join(__dirname, '..', 'src', 'renderer', 'components', `${component}.tsx`);
    assert(fs.existsSync(componentPath), `Component ${component} should exist`);
  });
});

test('API wrapper functions', () => {
  const apiPath = path.join(__dirname, '..', 'src', 'renderer', 'api.ts');
  const apiContent = fs.readFileSync(apiPath, 'utf-8');
  
  const functions = [
    'searchStreamer',
    'getVODs',
    'downloadVOD',
    'getConfig',
    'saveConfig'
  ];
  
  functions.forEach(fn => {
    assert(apiContent.includes(fn), `API function ${fn} should be defined`);
  });
});

// Run tests
async function runTests() {
  console.log(`Running ${tests.length} tests...\n`);
  
  const results = [];
  
  for (const { name, fn } of tests) {
    testCount++;
    process.stdout.write(`[${testCount}/${tests.length}] ${name}...`);
    
    try {
      await fn();
      process.stdout.write(' ✅\n');
      results.push({ name, passed: true });
    } catch (error) {
      process.stdout.write(' ❌\n');
      console.error(`   ${error.message}\n`);
      results.push({ name, passed: false, error: error.message });
    }
  }
  
  // Summary
  console.log('\n📊 Test Results:');
  const passed = results.filter(r => r.passed).length;
  const failed = results.filter(r => !r.passed).length;
  
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   📋 Total: ${tests.length}`);
  
  if (failed > 0) {
    console.log('\n🔴 Failed tests:');
    results.filter(r => !r.passed).forEach(r => {
      console.log(`   - ${r.name}`);
      console.log(`     ${r.error}`);
    });
    process.exit(1);
  } else {
    console.log('\n✨ All tests passed!');
  }
}

// Check for --quick flag
if (process.argv.includes('--quick')) {
  // Remove TypeScript compilation test for quick mode
  tests.splice(1, 1);
}

runTests().catch(error => {
  console.error('\n❌ Test runner failed:', error);
  process.exit(1);
});