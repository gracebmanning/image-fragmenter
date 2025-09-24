import { useState, useCallback } from "react";
import GIF from "gif.js";
import applyEffects from "../utils/imageEffects";

const getCanvasBlob = (canvas) => {
    return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
};

export const useFrameGenerator = ({ isCancelledRef, gifRef, gifCacheRef, loadingStateSetters, effects, outputDimensions, setOutputDimensions }) => {
    const [generatedFrames, setGeneratedFrames] = useState([]);

    const generateFrames = useCallback(
        async (originalImage, frameCount) => {
            if (!originalImage) return;
            isCancelledRef.current = false; // reset cancellation flag

            loadingStateSetters.setIsProcessing(true);
            loadingStateSetters.setStatus("Preparing image...");

            const maxWidth = 1920;
            const maxHeight = 1080;
            let imageToProcess = originalImage;
            let finalWidth = originalImage.width;
            let finalHeight = originalImage.height;

            if (originalImage.width > maxWidth || originalImage.height > maxHeight) {
                loadingStateSetters.setStatus("Image is large, scaling for compatibility...");
                const scaleFactor = Math.min(maxWidth / originalImage.width, maxHeight / originalImage.height);
                finalWidth = Math.floor(originalImage.width * scaleFactor);
                finalHeight = Math.floor(originalImage.height * scaleFactor);

                const scalingCanvas = document.createElement("canvas");
                scalingCanvas.width = finalWidth;
                scalingCanvas.height = finalHeight;
                const scalingCtx = scalingCanvas.getContext("2d", { willReadFrequently: true });
                scalingCtx.drawImage(originalImage, 0, 0, finalWidth, finalHeight);
                imageToProcess = scalingCanvas;
            }

            // H264 only supports even sized frames
            if (finalWidth % 2 !== 0) finalWidth--;
            if (finalHeight % 2 !== 0) finalHeight--;

            setOutputDimensions({ width: finalWidth, height: finalHeight });

            const frames = [];
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            canvas.width = finalWidth;
            canvas.height = finalHeight;
            ctx.drawImage(imageToProcess, 0, 0);

            frames.push(await getCanvasBlob(canvas));

            for (let i = 0; i < frameCount; i++) {
                const cropWidth = Math.floor(Math.random() * canvas.width) + 1;
                const cropHeight = Math.floor(Math.random() * canvas.height) + 1;

                const left = Math.floor(Math.random() * (canvas.width - cropWidth + 1));
                const top = Math.floor(Math.random() * canvas.height - cropHeight + 1);

                const cropCanvas = document.createElement("canvas");
                cropCanvas.width = cropWidth;
                cropCanvas.height = cropHeight;
                cropCanvas.getContext("2d", { willReadFrequently: true }).drawImage(imageToProcess, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

                const pasteX = Math.floor(Math.random() * (canvas.width - cropWidth + 1));
                const pasteY = Math.floor(Math.random() * (canvas.height - cropHeight + 1));
                ctx.drawImage(cropCanvas, pasteX, pasteY);

                frames.push(await getCanvasBlob(canvas));
                loadingStateSetters.setStatus(`Generating frame ${i + 1} of ${frameCount}...`);
            }

            setGeneratedFrames(frames);
            loadingStateSetters.setIsProcessing(false);
            loadingStateSetters.setStatus("Preview ready. Adjust settings and download your art!");
        },
        [isCancelledRef, loadingStateSetters, setOutputDimensions]
    );

    const generateFinalGifBlob = useCallback(
        (delay) => {
            return new Promise(async (resolve, reject) => {
                if (generatedFrames.length === 0) {
                    reject(new Error("No frames to render."));
                    return;
                }

                //abort any previous instance before starting a new one
                if (gifRef.current) {
                    gifRef.current.abort();
                }

                // check for cached gif
                if (gifCacheRef.current) {
                    resolve(gifCacheRef.current);
                    return;
                }

                isCancelledRef.current = false;
                loadingStateSetters.setIsRenderingGif(true);
                loadingStateSetters.setGifProgress(0);
                loadingStateSetters.setStatus("Rendering GIF...");

                const { width, height } = outputDimensions;
                const gif = new GIF({
                    workers: 4,
                    quality: 10,
                    width: width,
                    height: height,
                    workerScript: "/js/gif.worker.js",
                });
                gifRef.current = gif;

                gif.on("progress", (p) => {
                    if (isCancelledRef.current) {
                        gif.abort();
                        return reject(new Error("Cancelled"));
                    }
                    const progressPercent = Math.round(p * 100);
                    loadingStateSetters.setGifProgress(progressPercent);
                    loadingStateSetters.setStatus(`Rendering GIF: ${progressPercent}%`);
                });

                gif.on("finished", (blob) => {
                    gifRef.current = null; // clear ref once finished
                    gifCacheRef.current = blob; // cache the generated gif
                    if (isCancelledRef.current) {
                        return reject(new Error("Cancelled"));
                    }
                    loadingStateSetters.setIsRenderingGif(false);
                    loadingStateSetters.setGifProgress(100);
                    loadingStateSetters.setStatus("GIF Rendered!");
                    resolve(blob);
                });

                const imageElements = await Promise.all(
                    generatedFrames.map((blob) => {
                        return new Promise((resolveImg) => {
                            const img = new Image();
                            img.onload = () => resolveImg(img);
                            img.src = URL.createObjectURL(blob);
                        });
                    })
                );

                // temporary canvas to apply effects before adding to GIF
                const tempCanvas = document.createElement("canvas");
                tempCanvas.width = width;
                tempCanvas.height = height;
                const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

                // effects.seamless loop
                let framesToRender = [...imageElements];
                if (effects.seamless) {
                    // reverse frames and remove first and last to avoid duplicates
                    const reversed = [...imageElements].reverse().slice(1, -1);
                    framesToRender = [...framesToRender, ...reversed];
                }

                framesToRender.forEach((img) => {
                    tempCtx.clearRect(0, 0, width, height);
                    tempCtx.drawImage(img, 0, 0, width, height);
                    applyEffects(tempCtx, width, height, effects);
                    gif.addFrame(tempCanvas, { delay: delay, copy: true }); // copy=true to capture the current state of the temp canvas
                });

                imageElements.forEach((img) => {
                    URL.revokeObjectURL(img.src);
                });

                gif.render();
            });
        },
        [generatedFrames, effects, outputDimensions, isCancelledRef, gifRef, gifCacheRef, loadingStateSetters]
    );

    return { generatedFrames, setGeneratedFrames, generateFrames, generateFinalGifBlob };
};
