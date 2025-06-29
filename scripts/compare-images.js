const fs = require('fs');
const path = require('path');
const { createCanvas, loadImage } = require('canvas');

// Advanced image comparison utility
async function compareImages(image1Path, image2Path, outputPath) {
  try {
    // Check if canvas module is available
    if (!createCanvas) {
      return simpleCompare(image1Path, image2Path);
    }

    const img1 = await loadImage(image1Path);
    const img2 = await loadImage(image2Path);

    // Check dimensions
    if (img1.width !== img2.width || img1.height !== img2.height) {
      return {
        identical: false,
        pixelsDiff: -1,
        percentDiff: 100,
        message: `Dimension mismatch: ${img1.width}x${img1.height} vs ${img2.width}x${img2.height}`
      };
    }

    const width = img1.width;
    const height = img1.height;

    // Create canvases
    const canvas1 = createCanvas(width, height);
    const canvas2 = createCanvas(width, height);
    const canvasDiff = createCanvas(width, height);

    const ctx1 = canvas1.getContext('2d');
    const ctx2 = canvas2.getContext('2d');
    const ctxDiff = canvasDiff.getContext('2d');

    // Draw images
    ctx1.drawImage(img1, 0, 0);
    ctx2.drawImage(img2, 0, 0);

    // Get image data
    const data1 = ctx1.getImageData(0, 0, width, height);
    const data2 = ctx2.getImageData(0, 0, width, height);
    const dataDiff = ctxDiff.createImageData(width, height);

    let diffPixels = 0;
    const threshold = 5; // Pixel difference threshold

    // Compare pixels
    for (let i = 0; i < data1.data.length; i += 4) {
      const r1 = data1.data[i];
      const g1 = data1.data[i + 1];
      const b1 = data1.data[i + 2];
      const a1 = data1.data[i + 3];

      const r2 = data2.data[i];
      const g2 = data2.data[i + 1];
      const b2 = data2.data[i + 2];
      const a2 = data2.data[i + 3];

      const diff = Math.abs(r1 - r2) + Math.abs(g1 - g2) + Math.abs(b1 - b2) + Math.abs(a1 - a2);

      if (diff > threshold) {
        diffPixels++;
        // Highlight differences in red
        dataDiff.data[i] = 255;     // R
        dataDiff.data[i + 1] = 0;   // G
        dataDiff.data[i + 2] = 0;   // B
        dataDiff.data[i + 3] = 255; // A
      } else {
        // Keep original pixel with reduced opacity
        dataDiff.data[i] = r1;
        dataDiff.data[i + 1] = g1;
        dataDiff.data[i + 2] = b1;
        dataDiff.data[i + 3] = 64; // Reduced opacity
      }
    }

    // Calculate percentage difference
    const totalPixels = width * height;
    const percentDiff = (diffPixels / totalPixels) * 100;

    // Save diff image if there are differences
    if (diffPixels > 0 && outputPath) {
      ctxDiff.putImageData(dataDiff, 0, 0);
      const buffer = canvasDiff.toBuffer('image/png');
      fs.writeFileSync(outputPath, buffer);
    }

    return {
      identical: diffPixels === 0,
      pixelsDiff: diffPixels,
      percentDiff: percentDiff.toFixed(2),
      dimensions: `${width}x${height}`,
      threshold
    };
  } catch (error) {
    // Fallback to simple comparison if canvas is not available
    return simpleCompare(image1Path, image2Path);
  }
}

// Simple binary comparison fallback
function simpleCompare(image1Path, image2Path) {
  const buffer1 = fs.readFileSync(image1Path);
  const buffer2 = fs.readFileSync(image2Path);
  
  const identical = buffer1.equals(buffer2);
  const sizeDiff = Math.abs(buffer1.length - buffer2.length);
  const percentDiff = (sizeDiff / Math.max(buffer1.length, buffer2.length)) * 100;

  return {
    identical,
    pixelsDiff: identical ? 0 : -1,
    percentDiff: percentDiff.toFixed(2),
    message: 'Using simple binary comparison (install canvas for pixel comparison)'
  };
}

// Export for use in other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { compareImages };
}

// CLI usage
if (require.main === module) {
  const args = process.argv.slice(2);
  
  if (args.length < 2) {
    console.log('Usage: node compare-images.js <image1> <image2> [output-diff]');
    process.exit(1);
  }

  const [image1, image2, outputDiff] = args;

  compareImages(image1, image2, outputDiff)
    .then(result => {
      console.log('\nImage Comparison Results:');
      console.log('-------------------------');
      console.log(`Identical: ${result.identical ? '✅ Yes' : '❌ No'}`);
      if (result.dimensions) {
        console.log(`Dimensions: ${result.dimensions}`);
      }
      if (result.pixelsDiff >= 0) {
        console.log(`Pixels Different: ${result.pixelsDiff.toLocaleString()}`);
      }
      console.log(`Difference: ${result.percentDiff}%`);
      if (result.message) {
        console.log(`Note: ${result.message}`);
      }
      if (outputDiff && result.pixelsDiff > 0) {
        console.log(`\nDiff image saved: ${outputDiff}`);
      }
      
      process.exit(result.identical ? 0 : 1);
    })
    .catch(error => {
      console.error('Error comparing images:', error.message);
      process.exit(1);
    });
}