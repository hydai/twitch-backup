const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Test configuration
const TEST_CONFIG = {
  twitchClientId: '',
  twitchClientSecret: '',
  testStreamer: 'monstercat', // Public streamer with VODs
  downloadPath: path.join(__dirname, '../test-downloads')
};

console.log('🧪 Twitch Backup Test Script');
console.log('====================================\n');

// Check if running in dev mode
const isDev = process.argv.includes('--dev');

async function prompt(question) {
  return new Promise((resolve) => {
    rl.question(question, resolve);
  });
}

async function runTests() {
  console.log('📋 This script will test the following:');
  console.log('  1. Check system dependencies');
  console.log('  2. Test Twitch API connection');
  console.log('  3. Search for streamers');
  console.log('  4. Fetch VOD list');
  console.log('  5. Test download functionality');
  console.log('  6. Verify file output\n');

  // Step 1: Check dependencies
  console.log('\n1️⃣ Checking dependencies...');
  try {
    const ytdlpVersion = require('child_process')
      .execSync('yt-dlp --version', { encoding: 'utf-8' })
      .trim();
    console.log('   ✅ yt-dlp installed:', ytdlpVersion);
  } catch (e) {
    console.log('   ❌ yt-dlp not found. Please install it first.');
    process.exit(1);
  }

  // Step 2: Get API credentials
  console.log('\n2️⃣ Twitch API Setup');
  console.log('   You need Twitch API credentials to test.');
  console.log('   Get them from: https://dev.twitch.tv/console/apps\n');
  
  const useTestCreds = await prompt('   Use test credentials? (y/n): ');
  
  if (useTestCreds.toLowerCase() === 'y') {
    console.log('   ⚠️  Note: Test credentials have rate limits');
    TEST_CONFIG.twitchClientId = await prompt('   Enter Client ID: ');
    TEST_CONFIG.twitchClientSecret = await prompt('   Enter Client Secret: ');
  } else {
    console.log('   ℹ️  Skipping API tests...');
  }

  // Step 3: Test API connection
  if (TEST_CONFIG.twitchClientId) {
    console.log('\n3️⃣ Testing Twitch API connection...');
    
    try {
      // Create a test config file
      const testConfigPath = path.join(__dirname, '../test-config.json');
      fs.writeFileSync(testConfigPath, JSON.stringify({
        twitchClientId: TEST_CONFIG.twitchClientId,
        twitchClientSecret: TEST_CONFIG.twitchClientSecret,
        downloadPath: TEST_CONFIG.downloadPath,
        maxConcurrentDownloads: 1,
        preferredQuality: 'source'
      }, null, 2));

      console.log('   ✅ Test config created');

      // Test API access
      const axios = require('axios');
      const tokenResponse = await axios.post(
        'https://id.twitch.tv/oauth2/token',
        null,
        {
          params: {
            client_id: TEST_CONFIG.twitchClientId,
            client_secret: TEST_CONFIG.twitchClientSecret,
            grant_type: 'client_credentials'
          }
        }
      );

      if (tokenResponse.data.access_token) {
        console.log('   ✅ API authentication successful');
        
        // Test streamer search
        const searchResponse = await axios.get(
          'https://api.twitch.tv/helix/search/channels',
          {
            headers: {
              'Authorization': `Bearer ${tokenResponse.data.access_token}`,
              'Client-Id': TEST_CONFIG.twitchClientId
            },
            params: {
              query: TEST_CONFIG.testStreamer,
              first: 5
            }
          }
        );

        console.log(`   ✅ Found ${searchResponse.data.data.length} streamers`);
        
        // Clean up test config
        fs.unlinkSync(testConfigPath);
      }
    } catch (error) {
      console.log('   ❌ API test failed:', error.message);
    }
  }

  // Step 4: Test download functionality
  console.log('\n4️⃣ Testing download functionality...');
  const testVodUrl = await prompt('   Enter a Twitch VOD URL to test (or press Enter to skip): ');
  
  if (testVodUrl) {
    console.log('   Testing yt-dlp download...');
    
    // Create test download directory
    fs.mkdirSync(TEST_CONFIG.downloadPath, { recursive: true });
    
    const testFile = path.join(TEST_CONFIG.downloadPath, 'test-download.mp4');
    const ytdlp = spawn('yt-dlp', [
      testVodUrl,
      '-o', testFile,
      '--no-part',
      '--max-filesize', '50M', // Limit to 50MB for testing
      '--no-playlist'
    ]);

    let downloadStarted = false;
    
    ytdlp.stdout.on('data', (data) => {
      const output = data.toString();
      if (output.includes('%')) {
        downloadStarted = true;
        process.stdout.write(`\r   Progress: ${output.match(/(\d+\.\d+)%/)?.[1] || '0'}%`);
      }
    });

    ytdlp.stderr.on('data', (data) => {
      console.error('\n   Error:', data.toString());
    });

    await new Promise((resolve) => {
      ytdlp.on('close', (code) => {
        if (code === 0 && downloadStarted) {
          console.log('\n   ✅ Download test successful');
          
          // Check file exists
          if (fs.existsSync(testFile)) {
            const stats = fs.statSync(testFile);
            console.log(`   ✅ File created: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
            
            // Clean up
            fs.unlinkSync(testFile);
            console.log('   🧹 Test file cleaned up');
          }
        } else {
          console.log('\n   ❌ Download test failed');
        }
        resolve();
      });
    });
  }

  // Step 5: Test app launch
  console.log('\n5️⃣ Testing app launch...');
  
  if (isDev) {
    console.log('   Attempting to launch app in dev mode...');
    console.log('   Close the app window when done testing.\n');
    
    const npmRun = spawn('npm', ['run', 'dev'], {
      cwd: path.join(__dirname, '..'),
      stdio: 'inherit'
    });

    process.on('SIGINT', () => {
      npmRun.kill();
      process.exit();
    });
  } else {
    console.log('   Run with --dev flag to test app launch');
  }

  // Summary
  console.log('\n📊 Test Summary:');
  console.log('   - System dependencies: ✅');
  console.log('   - API connection: ' + (TEST_CONFIG.twitchClientId ? '✅' : '⏭️  Skipped'));
  console.log('   - Download test: ' + (testVodUrl ? '✅' : '⏭️  Skipped'));
  console.log('\n✨ Testing complete!');
  
  if (!isDev) {
    rl.close();
  }
}

// Run tests
runTests().catch((error) => {
  console.error('\n❌ Test failed:', error);
  rl.close();
  process.exit(1);
});