const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Building Twitch VOD Downloader for all platforms...');

// Clean previous builds
console.log('🧹 Cleaning previous builds...');
try {
  execSync('rm -rf dist release', { stdio: 'inherit' });
} catch (e) {
  // Ignore errors
}

// Generate icons
console.log('\n🎨 Generating icons...');
try {
  execSync('node scripts/build-icons.js', { stdio: 'inherit' });
} catch (e) {
  console.warn('⚠️  Icon generation failed, continuing...');
}

// Install dependencies
console.log('\n📦 Installing dependencies...');
execSync('npm install', { stdio: 'inherit' });

// Build the app
console.log('\n🔨 Building application...');
execSync('npm run build', { stdio: 'inherit' });

// Build for all platforms
const platforms = {
  mac: 'npm run dist:mac',
  win: 'npm run dist:win',
  linux: 'npm run dist:linux'
};

// Detect current platform
const currentPlatform = process.platform === 'darwin' ? 'mac' : 
                       process.platform === 'win32' ? 'win' : 'linux';

// Build for current platform first
console.log(`\n🎯 Building for ${currentPlatform}...`);
try {
  execSync(platforms[currentPlatform], { stdio: 'inherit' });
  console.log(`✅ ${currentPlatform} build complete!`);
} catch (error) {
  console.error(`❌ ${currentPlatform} build failed:`, error.message);
}

// Optionally build for all platforms
if (process.argv.includes('--all')) {
  console.log('\n🌍 Building for all platforms...');
  for (const [platform, command] of Object.entries(platforms)) {
    if (platform !== currentPlatform) {
      console.log(`\n🎯 Building for ${platform}...`);
      try {
        execSync(command, { stdio: 'inherit' });
        console.log(`✅ ${platform} build complete!`);
      } catch (error) {
        console.error(`❌ ${platform} build failed:`, error.message);
      }
    }
  }
}

console.log('\n🎉 Build process complete!');
console.log('📦 Distributables can be found in the release/ directory');

// List built files
const releaseDir = path.join(__dirname, '../release');
if (fs.existsSync(releaseDir)) {
  console.log('\n📁 Built files:');
  const files = fs.readdirSync(releaseDir, { recursive: true })
    .filter(f => f.endsWith('.dmg') || f.endsWith('.exe') || f.endsWith('.AppImage') || f.endsWith('.deb'));
  files.forEach(file => {
    const stats = fs.statSync(path.join(releaseDir, file));
    const size = (stats.size / 1024 / 1024).toFixed(2);
    console.log(`   - ${file} (${size} MB)`);
  });
}