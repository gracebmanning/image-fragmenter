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

function applyEdgeDetect(data, width, height) {
    const output = new Uint8ClampedArray(data.length);
    const kernelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const kernelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    const width4 = width * 4;

    for (let y = 1; y < height - 1; y++) {
        const y_offset = y * width4;
        for (let x = 1; x < width - 1; x++) {
            const i = y_offset + x * 4;
            let gx_r = 0,
                gy_r = 0;
            let gx_g = 0,
                gy_g = 0;
            let gx_b = 0,
                gy_b = 0;

            // unrolled loop for 3x3 kernel
            // top row
            let src = i - width4 - 4;
            gx_r += data[src] * kernelX[0];
            gy_r += data[src] * kernelY[0];
            gx_g += data[src + 1] * kernelX[0];
            gy_g += data[src + 1] * kernelY[0];
            gx_b += data[src + 2] * kernelX[0];
            gy_b += data[src + 2] * kernelY[0];

            src += 4;
            gy_r += data[src] * kernelY[1];
            gy_g += data[src + 1] * kernelY[1];
            gy_b += data[src + 2] * kernelY[1];

            src += 4;
            gx_r += data[src] * kernelX[2];
            gy_r += data[src] * kernelY[2];
            gx_g += data[src + 1] * kernelX[2];
            gy_g += data[src + 1] * kernelY[2];
            gx_b += data[src + 2] * kernelX[2];
            gy_b += data[src + 2] * kernelY[2];

            // middle row
            src = i - 4;
            gx_r += data[src] * kernelX[3];
            gx_g += data[src + 1] * kernelX[3];
            gx_b += data[src + 2] * kernelX[3];

            src += 8;
            gx_r += data[src] * kernelX[5];
            gx_g += data[src + 1] * kernelX[5];
            gx_b += data[src + 2] * kernelX[5];

            // bottom row
            src = i + width4 - 4;
            gx_r += data[src] * kernelX[6];
            gy_r += data[src] * kernelY[6];
            gx_g += data[src + 1] * kernelX[6];
            gy_g += data[src + 1] * kernelY[6];
            gx_b += data[src + 2] * kernelX[6];
            gy_b += data[src + 2] * kernelY[6];

            src += 4;
            gy_r += data[src] * kernelY[7];
            gy_g += data[src + 1] * kernelY[7];
            gy_b += data[src + 2] * kernelY[7];

            src += 4;
            gx_r += data[src] * kernelX[8];
            gy_r += data[src] * kernelY[8];
            gx_g += data[src + 1] * kernelX[8];
            gy_g += data[src + 1] * kernelY[8];
            gx_b += data[src + 2] * kernelX[8];
            gy_b += data[src + 2] * kernelY[8];

            const mag_r = Math.abs(gx_r) + Math.abs(gy_r);
            const mag_g = Math.abs(gx_g) + Math.abs(gy_g);
            const mag_b = Math.abs(gx_b) + Math.abs(gy_b);

            output[i] = mag_r;
            output[i + 1] = mag_g;
            output[i + 2] = mag_b;
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
