const { execSync } = require('child_process');
const os = require('os');

console.log('🔍 Checking build dependencies...');

const checks = [];

// Check Node.js version
try {
  const nodeVersion = process.version;
  const major = parseInt(nodeVersion.split('.')[0].substring(1));
  if (major >= 16) {
    checks.push({ name: 'Node.js', status: '✅', message: `${nodeVersion}` });
  } else {
    checks.push({ name: 'Node.js', status: '❌', message: `${nodeVersion} (requires 16+)` });
  }
} catch (e) {
  checks.push({ name: 'Node.js', status: '❌', message: 'Not found' });
}

// Check npm
try {
  const npmVersion = execSync('npm --version', { encoding: 'utf-8' }).trim();
  checks.push({ name: 'npm', status: '✅', message: npmVersion });
} catch (e) {
  checks.push({ name: 'npm', status: '❌', message: 'Not found' });
}

// Check yt-dlp
try {
  const ytdlpVersion = execSync('yt-dlp --version', { encoding: 'utf-8' }).trim();
  checks.push({ name: 'yt-dlp', status: '✅', message: ytdlpVersion });
} catch (e) {
  checks.push({ name: 'yt-dlp', status: '⚠️', message: 'Not found (required at runtime)' });
}

// Platform-specific checks
const platform = os.platform();

if (platform === 'darwin') {
  // Check for Xcode Command Line Tools
  try {
    execSync('xcode-select -p', { stdio: 'ignore' });
    checks.push({ name: 'Xcode CLT', status: '✅', message: 'Installed' });
  } catch (e) {
    checks.push({ name: 'Xcode CLT', status: '⚠️', message: 'Not found (run: xcode-select --install)' });
  }
  
  // Check for ImageMagick
  try {
    const convertVersion = execSync('convert --version', { encoding: 'utf-8' }).split('\n')[0];
    checks.push({ name: 'ImageMagick', status: '✅', message: 'Installed' });
  } catch (e) {
    checks.push({ name: 'ImageMagick', status: '📌', message: 'Optional (for icon generation)' });
  }
}

if (platform === 'win32') {
  // Check for Windows Build Tools
  try {
    execSync('npm list -g windows-build-tools', { stdio: 'ignore' });
    checks.push({ name: 'Build Tools', status: '✅', message: 'Installed' });
  } catch (e) {
    checks.push({ name: 'Build Tools', status: '⚠️', message: 'May be required' });
  }
}

if (platform === 'linux') {
  // Check for build essentials
  try {
    execSync('which gcc', { stdio: 'ignore' });
    checks.push({ name: 'Build Tools', status: '✅', message: 'gcc found' });
  } catch (e) {
    checks.push({ name: 'Build Tools', status: '⚠️', message: 'gcc not found' });
  }
}

// Display results
console.log('\n📦 Dependency Check Results:\n');

const maxNameLength = Math.max(...checks.map(c => c.name.length));
checks.forEach(check => {
  const padding = ' '.repeat(maxNameLength - check.name.length);
  console.log(`${check.status} ${check.name}${padding} : ${check.message}`);
});

// Summary
const errors = checks.filter(c => c.status === '❌').length;
const warnings = checks.filter(c => c.status === '⚠️').length;

if (errors > 0) {
  console.log(`\n❌ ${errors} error(s) found. Please install missing dependencies.`);
  process.exit(1);
} else if (warnings > 0) {
  console.log(`\n⚠️  ${warnings} warning(s) found. Build may succeed but some features might not work.`);
} else {
  console.log('\n✅ All dependencies satisfied!');
}

console.log('\n📌 Platform:', platform, `(${os.arch()})`);
console.log('📌 Node.js:', process.version);
console.log('📌 Working directory:', process.cwd());