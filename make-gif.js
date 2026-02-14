const GIFEncoder = require('gif-encoder-2');
const { createWriteStream, readFileSync } = require('fs');
const { PNG } = require('pngjs');
const path = require('path');

async function main() {
  const framesDir = path.join(__dirname, 'demo-frames');
  const frameFiles = [];
  for (let i = 1; i <= 10; i++) {
    frameFiles.push(path.join(framesDir, `frame_${String(i).padStart(2, '0')}.png`));
  }

  // Read first frame to get dimensions
  const firstPng = PNG.sync.read(readFileSync(frameFiles[0]));
  const width = firstPng.width;
  const height = firstPng.height;

  console.log(`Creating GIF: ${width}x${height}, ${frameFiles.length} frames`);

  const encoder = new GIFEncoder(width, height, 'neuquant', true);
  const outputPath = path.join(__dirname, 'screenshots', 'demo.gif');
  encoder.createReadStream().pipe(createWriteStream(outputPath));
  
  encoder.start();
  encoder.setDelay(2000); // 2 seconds per frame
  encoder.setQuality(10);
  encoder.setRepeat(0); // loop forever

  for (const frameFile of frameFiles) {
    console.log(`Processing: ${path.basename(frameFile)}`);
    const png = PNG.sync.read(readFileSync(frameFile));
    
    // Create raw pixel data array (RGBA)
    const pixels = new Uint8Array(width * height * 4);
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        pixels[idx] = png.data[idx];     // R
        pixels[idx + 1] = png.data[idx + 1]; // G
        pixels[idx + 2] = png.data[idx + 2]; // B
        pixels[idx + 3] = 255;            // A (opaque)
      }
    }
    encoder.addFrame(pixels);
  }

  encoder.finish();
  console.log(`GIF saved to: ${outputPath}`);
}

main().catch(err => {
  console.error('Error:', err.message);
  process.exit(1);
});
