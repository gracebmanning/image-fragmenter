// apply pixelation method to image data
function applyPixelate(ctx, width, height, pixelateLevel) {
  // Turn off image smoothing to get sharp pixels
  ctx.imageSmoothingEnabled = false;

  // Map the slider's 0-100 range to a pixel count.
  const sliderMax = 100;
  const minPixels = 5; // The smallest dimension for max pixelation
  const pixelsX = Math.round(width - (pixelateLevel / sliderMax) * (width - minPixels));
  const pixelsY = Math.round((pixelsX * height) / width); // Maintain aspect ratio

  // Use a temporary canvas to draw the scaled-down image
  const tempCanvas = document.createElement("canvas");
  tempCanvas.width = pixelsX;
  tempCanvas.height = pixelsY;
  const tempCtx = tempCanvas.getContext("2d");
  tempCtx.drawImage(ctx.canvas, 0, 0, width, height, 0, 0, pixelsX, pixelsY);

  // Clear the main canvas and draw the scaled-up, pixelated image
  ctx.clearRect(0, 0, width, height);
  ctx.drawImage(tempCanvas, 0, 0, pixelsX, pixelsY, 0, 0, width, height);

  // Restore image smoothing for other operations
  ctx.imageSmoothingEnabled = true;
}

// apply an edge detection convolution kernel to image data
function applyEdgeDetect(data, width, height) {
  const output = new Uint8ClampedArray(data.length);
  const conv = [-1, -1, -1, -1, 8, -1, -1, -1, -1];
  const halfside = Math.floor(3 / 2);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      let r = 0,
        g = 0,
        b = 0;
      for (let cy = 0; cy < 3; cy++) {
        for (let cx = 0; cx < 3; cx++) {
          const scy = y - halfside + cy;
          const scx = x - halfside + cx;

          if (scy >= 0 && scy < height && scx >= 0 && scx < width) {
            const src = (scy * width + scx) * 4;
            const f = cy * 3 + cx;
            r += data[src] * conv[f];
            g += data[src + 1] * conv[f];
            b += data[src + 2] * conv[f];
          }
        }
      }

      const i = (y * width + x) * 4;
      output[i] = r;
      output[i + 1] = g;
      output[i + 2] = b;
      output[i + 3] = 255;
    }
  }
  return output;
}

// apply pixel filters to image data
function applyPixelFilters(imageData, { invert, grayscale, sepia }) {
  const data = imageData.data;
  for (let i = 0; i < data.length; i += 4) {
    if (grayscale) {
      const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
      data[i] = avg; // red
      data[i + 1] = avg; // green
      data[i + 2] = avg; // blue
    }

    if (sepia) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];
      data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
      data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
      data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
    }

    if (invert) {
      data[i] = 255 - data[i]; // red
      data[i + 1] = 255 - data[i + 1]; // green
      data[i + 2] = 255 - data[i + 2]; // blue
    }
  }
}

export default function applyEffects(ctx, width, height, options) {
  const { invert, grayscale, sepia, edgeDetect, pixelate } = options;

  // pixelate must be applied first as it replaces the canvas content
  if (pixelate > 0) {
    applyPixelate(ctx, width, height, pixelate);
  }

  // if no other effects are enabled, stop here
  if (!invert && !grayscale && !sepia && !edgeDetect) {
    return;
  }

  // get pixel data
  const imageData = ctx.getImageData(0, 0, width, height);
  
  // apply edge detect
  if (edgeDetect) {
    const edgeData = applyEdgeDetect(imageData.data, width, height);
    imageData.data.set(edgeData);
  }

  // apply the remaining pixel-level filters
  applyPixelFilters(imageData, { invert, grayscale, sepia });

  // put manipulated data back onto canvas
  ctx.putImageData(imageData, 0, 0);
}