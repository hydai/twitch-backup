const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('🎨 Generating app icons...');

const svgPath = path.join(__dirname, '../build/icon.svg');
const buildDir = path.join(__dirname, '../build');

// Check if SVG exists
if (!fs.existsSync(svgPath)) {
  console.error('❌ icon.svg not found in build directory');
  process.exit(1);
}

// Function to check if command exists
function commandExists(cmd) {
  try {
    execSync(`which ${cmd}`, { stdio: 'ignore' });
    return true;
  } catch (e) {
    return false;
  }
}

// Generate PNG from SVG
try {
  if (commandExists('convert')) {
    // Use ImageMagick if available
    console.log('Using ImageMagick to generate PNG...');
    execSync(`convert -background none -density 512 ${svgPath} -resize 512x512 ${path.join(buildDir, 'icon.png')}`);
  } else if (commandExists('rsvg-convert')) {
    // Use librsvg if available
    console.log('Using rsvg-convert to generate PNG...');
    execSync(`rsvg-convert -w 512 -h 512 ${svgPath} -o ${path.join(buildDir, 'icon.png')}`);
  } else {
    console.warn('⚠️  No SVG converter found. Using SVG as fallback.');
    // Create a simple PNG placeholder
    fs.copyFileSync(svgPath, path.join(buildDir, 'icon.png'));
  }

  // Generate Windows ICO
  if (process.platform === 'win32' || commandExists('convert')) {
    console.log('Generating Windows .ico file...');
    const sizes = [16, 32, 48, 64, 128, 256];
    const pngFiles = [];
    
    for (const size of sizes) {
      const output = path.join(buildDir, `icon-${size}.png`);
      if (commandExists('convert')) {
        execSync(`convert -background none -density ${size} ${svgPath} -resize ${size}x${size} ${output}`);
      } else {
        fs.copyFileSync(path.join(buildDir, 'icon.png'), output);
      }
      pngFiles.push(output);
    }
    
    if (commandExists('convert')) {
      execSync(`convert ${pngFiles.join(' ')} ${path.join(buildDir, 'icon.ico')}`);
      // Clean up temp files
      pngFiles.forEach(f => fs.unlinkSync(f));
    }
  }

  // Generate macOS ICNS
  if (process.platform === 'darwin') {
    console.log('Generating macOS .icns file...');
    const iconsetPath = path.join(buildDir, 'icon.iconset');
    fs.mkdirSync(iconsetPath, { recursive: true });
    
    const sizes = [
      { size: 16, scale: 1 },
      { size: 16, scale: 2 },
      { size: 32, scale: 1 },
      { size: 32, scale: 2 },
      { size: 128, scale: 1 },
      { size: 128, scale: 2 },
      { size: 256, scale: 1 },
      { size: 256, scale: 2 },
      { size: 512, scale: 1 },
      { size: 512, scale: 2 },
    ];
    
    for (const { size, scale } of sizes) {
      const actualSize = size * scale;
      const filename = scale === 2 ? `icon_${size}x${size}@2x.png` : `icon_${size}x${size}.png`;
      const output = path.join(iconsetPath, filename);
      
      if (commandExists('sips')) {
        execSync(`sips -z ${actualSize} ${actualSize} ${path.join(buildDir, 'icon.png')} --out ${output}`, { stdio: 'ignore' });
      } else {
        fs.copyFileSync(path.join(buildDir, 'icon.png'), output);
      }
    }
    
    if (commandExists('iconutil')) {
      execSync(`iconutil -c icns ${iconsetPath} -o ${path.join(buildDir, 'icon.icns')}`);
      execSync(`rm -rf ${iconsetPath}`);
    }
  }

  console.log('✅ Icons generated successfully!');
} catch (error) {
  console.error('❌ Error generating icons:', error.message);
  console.log('\n📌 For better icon generation, install:')
  console.log('   - macOS: brew install imagemagick');
  console.log('   - Linux: sudo apt install imagemagick librsvg2-bin');
  console.log('   - Windows: Install ImageMagick from https://imagemagick.org');
}