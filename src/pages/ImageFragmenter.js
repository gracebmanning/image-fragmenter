import { useEffect, useState, useRef } from "react";
import { TbBolt, TbTrash } from "react-icons/tb";
import JSZip from "jszip";
import GIF from "gif.js";
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import applyEffects from "../utils/imageEffects";
import { useImageEffects } from "../hooks/useImageEffects";
import { useLoadingStates } from "../hooks/useLoadingStates";

import mouse from "../assets/mouse_speed.png";
import trash from "../assets/recycle_bin_full-2.png";
import help from "../assets/help_sheet-0.png";

import HelpDialog from "../components/HelpDialog";
import EffectControls from "../components/EffectControls";
import DownloadPanel from "../components/DownloadPanel";
import ProgressBar from "../components/ProgressBar";
import Layout from "../layouts/layout";
import DelaySlider from "../components/DelaySlider";
import FrameCountField from "../components/FrameCountField";

export default function ImageFragmenter() {
    const [originalImage, setOriginalImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [generatedFrames, setGeneratedFrames] = useState([]);
    const [preloadedImages, setPreloadedImages] = useState([]);
    const [frameCount, setFrameCount] = useState(40);
    const [gifDelay, setGifDelay] = useState(100);
    const [outputDimensions, setOutputDimensions] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { effects, ...effectSetters } = useImageEffects();
    const { loadingStates, ...loadingStateSetters } = useLoadingStates();

    // FFmpeg State
    const [ffmpeg, setFfmpeg] = useState(null);
    const [ffmpegRead, setFfmpegReady] = useState(false);

    // Refs
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const playbackTimeoutIdRef = useRef(null);
    const isCancelledRef = useRef(null);
    const gifRef = useRef(null);
    const gifCacheRef = useRef(null);

    // FILENAMES
    const zipFilename = `glitch-images.zip`;
    const gifFilename = `animation_${gifDelay}ms.gif`;
    const videoFilename = `animation_${gifDelay}ms.mp4`;

    const allBusy = loadingStates.isProcessing || loadingStates.isDownloading || loadingStates.isRenderingGif;

    useEffect(() => {
        const loadFfmpeg = async () => {
            const ffmpegInstance = new FFmpeg();
            const baseURL = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";
            await ffmpegInstance.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, "text/javascript"),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, "application/wasm"),
            });
            setFfmpeg(ffmpegInstance);
            setFfmpegReady(true);
        };
        loadFfmpeg();
    }, []);

    // clear cache and revoke existing URLs if settings change
    useEffect(() => {
        console.log("in use effect");
        if (gifCacheRef.current) {
            gifCacheRef.current = null;
        }
    }, [gifDelay, effects.edgeDetect, effects.grayscale, effects.invert, effects.pixelate, effects.seamless, effects.sepia]);

    // preload images once when frames are generated
    useEffect(() => {
        // if there are no frames, clear the preloaded images
        if (generatedFrames.length === 0) {
            setPreloadedImages([]);
            return;
        }

        let isActive = true;
        //let currentImages = [];

        // convert all frame blobs to HTMLImageElements
        Promise.all(
            generatedFrames.map((blob) => {
                return new Promise((resolve) => {
                    const img = new Image();
                    img.onload = () => resolve(img);
                    img.src = URL.createObjectURL(blob);
                });
            })
        ).then((images) => {
            if (isActive) {
                //currentImages = images;
                setPreloadedImages(images);
            }
        });

        return () => {
            isActive = false;
            //currentImages.forEach(img => URL.revokeObjectURL(img.src));
        };
    }, [generatedFrames]);

    // handle the animation playback loop, update preview when effects are changed
    useEffect(() => {
        // clear the previous loop before starting a new one
        if (playbackTimeoutIdRef.current) {
            clearTimeout(playbackTimeoutIdRef.current);
        }

        // run animation
        if (preloadedImages.length > 0 && canvasRef.current && !allBusy) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d", { willReadFrequently: true });
            const { width, height } = outputDimensions;
            canvas.width = width;
            canvas.height = height;

            // create a frame sequence in case of 'effects.effects.seamless' option
            let frameSequence = Array.from({ length: preloadedImages.length }, (_, i) => i);
            if (effects.seamless && preloadedImages.length > 2) {
                const reversed = [...frameSequence].reverse().slice(1, -1);
                frameSequence = [...frameSequence, ...reversed];
            }

            let sequenceIndex = 0;

            const nextFrame = () => {
                if (!canvasRef.current || preloadedImages.length === 0) return;

                ctx.clearRect(0, 0, width, height);

                // get correct frame index from new sequence
                const frameIndex = frameSequence[sequenceIndex];

                // draw the current preloaded image
                ctx.drawImage(preloadedImages[frameIndex], 0, 0, width, height);

                // apply effects to canvas
                applyEffects(ctx, width, height, effects);

                // move to the next frame
                sequenceIndex = (sequenceIndex + 1) % frameSequence.length;

                // schedule the next frame draw with the current delay
                playbackTimeoutIdRef.current = setTimeout(nextFrame, gifDelay);
            };

            nextFrame();
        }

        return () => {
            clearTimeout(playbackTimeoutIdRef.current);
        };
    }, [preloadedImages, gifDelay, allBusy, outputDimensions, effects]);

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        if (!["image/png", "image/jpeg"].includes(file.type)) {
            loadingStateSetters.setStatus("Unsupported file type.");
            return;
        }
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                setImagePreview(e.target.result);
                loadingStateSetters.setStatus("Image loaded. Ready to generate.");
                setGeneratedFrames([]);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const resetImage = () => {
        setOriginalImage(null);
        setImagePreview(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
    };

    const startOver = () => {
        isCancelledRef.current = true;

        // if (ffmpeg && isDownloading === 'video'){
        //  ffmpeg.exit();
        // }

        // if a gif.js worker is running, terminate it
        if (gifRef.current) {
            gifRef.current.abort();
            gifRef.current = null;
        }

        // reset cache
        if (gifCacheRef.current) {
            gifCacheRef.current = null;
        }

        setOriginalImage(null);
        setImagePreview(null);
        setGeneratedFrames([]);
        setPreloadedImages([]);
        setFrameCount(40);
        setOutputDimensions(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }

        loadingStateSetters.setStatus("Select an image to start.");
        loadingStateSetters.setIsProcessing(false);
        loadingStateSetters.setIsDownloading(null);
        loadingStateSetters.setGifProgress(0);
        loadingStateSetters.setVideoProgress(0);

        setGifDelay(100);
        loadingStateSetters.setIsRenderingGif(false);

        effectSetters.resetEffects();
    };

    const generateFrames = async () => {
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

        const newOutputDimensions = { width: finalWidth, height: finalHeight };
        setOutputDimensions(newOutputDimensions);

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
    };

    const generateFinalGifBlob = (delay) => {
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
                console.log("cached gif:", gifCacheRef);
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
    };

    const getCanvasBlob = (canvas) => {
        return new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.9));
    };

    const triggerDownload = async (blob, filename) => {
        const file = new File([blob], filename, { type: blob.type });

        // check for iOS devices
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);

        // files types that should use the Web Share API on mobile
        const mediaTypesForSharing = ["image/gif", "video/mp4"];
        const shouldUseShareAPI = isIOS && mediaTypesForSharing.includes(file.type) && navigator.share;

        // use Web Share API on mobile if available
        if (shouldUseShareAPI) {
            // CASE 1: Gif/Video on an iOS device
            try {
                await navigator.share({
                    files: [file],
                    title: "My Fragmented Image",
                    text: "Check out this animation!",
                });
                loadingStateSetters.setStatus("Shared successfully!");
            } catch (error) {
                // catch if the user cancels the share.
                // don't need a fallback here because cancelling is intentional.
                console.log("Share was cancelled or failed", error);
                loadingStateSetters.setStatus("Share cancelled.");
            }
        } else {
            // CASE 2: GIFs/Videos on Desktop/non-iOS mobile, ZIPs on all devices
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();

            // cleanup
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }
    };

    const downloadZip = async () => {
        if (typeof JSZip === "undefined") {
            alert("JSZip library not loaded yet. Please wait.");
            return;
        }
        loadingStateSetters.setIsDownloading("zip");
        loadingStateSetters.setStatus("Applying effects and creating ZIP...");
        const zip = new JSZip();

        // create temporary canvas to apply effects
        const { width, height } = outputDimensions;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true });

        // use preloadedImages as they are already decoded and ready to draw
        for (let i = 0; i < preloadedImages.length; i++) {
            const img = preloadedImages[i];

            tempCtx.clearRect(0, 0, width, height);
            tempCtx.drawImage(img, 0, 0, width, height);

            applyEffects(tempCtx, width, height, effects);

            const newBlob = await new Promise((resolve) => tempCanvas.toBlob(resolve, "image/jpeg", 0.9));

            zip.file(`frame_${String(i).padStart(4, "0")}.jpg`, newBlob);
        }

        loadingStateSetters.setStatus("Generating ZIP file...");
        const zipBlob = await zip.generateAsync({ type: "blob" });
        triggerDownload(zipBlob, zipFilename);
        loadingStateSetters.setStatus("ZIP download started!");
        loadingStateSetters.setIsDownloading(null);
    };

    const downloadGif = async () => {
        loadingStateSetters.setIsDownloading("gif");
        try {
            const finalGifBlob = await generateFinalGifBlob(gifDelay);
            if (!isCancelledRef.current) {
                triggerDownload(finalGifBlob, gifFilename);
                loadingStateSetters.setStatus("GIF download started!");
            }
        } catch (error) {
            if (!isCancelledRef.current) {
                console.error("Failed to generate GIF:", error);
                loadingStateSetters.setStatus("Error creating GIF. See console.");
            }
        }
        loadingStateSetters.setIsDownloading(null);
    };

    const downloadVideo = async () => {
        if (!ffmpegRead || !ffmpeg) {
            loadingStateSetters.setStatus("FFmpeg is not loaded yet. Please wait.");
            return;
        }

        isCancelledRef.current = false;
        loadingStateSetters.setIsDownloading("video");
        loadingStateSetters.setVideoProgress(0);

        try {
            loadingStateSetters.setStatus("Rendering GIF for video conversion...");
            const finalGifBlob = await generateFinalGifBlob(gifDelay);

            if (isCancelledRef.current) return;

            const files = await ffmpeg.listDir("/");
            if (files.some((file) => file.name === gifFilename)) {
                await ffmpeg.deleteFile(gifFilename);
            }
            if (files.some((file) => file.name === videoFilename)) {
                await ffmpeg.deleteFile(videoFilename);
            }

            await ffmpeg.writeFile(gifFilename, await fetchFile(finalGifBlob));

            loadingStateSetters.setStatus("Converting GIF to MP4...");
            ffmpeg.on("progress", ({ progress }) => {
                loadingStateSetters.setVideoProgress(Math.min(100, Math.round(progress * 100)));
            });

            await ffmpeg.exec([
                "-i",
                gifFilename, // Input file
                "-movflags",
                "+faststart", // Optimizes for web playback
                "-c:v",
                "libx264", // Video codec
                "-pix_fmt",
                "yuv420p", // Crucial for compatibility
                videoFilename, // Output file
            ]);

            if (isCancelledRef.current) return;

            loadingStateSetters.setStatus("Finalizing video file...");
            const data = await ffmpeg.readFile(videoFilename);
            const videoBlob = new Blob([data], { type: "video/mp4" });
            triggerDownload(videoBlob, videoFilename);
            loadingStateSetters.setStatus("Video download started!");
        } catch (error) {
            if (!isCancelledRef.current) {
                console.error("Error converting GIF to video with FFmpeg:", error);
                loadingStateSetters.setStatus("Failed to create video. See console.");
            }
        } finally {
            loadingStateSetters.setIsDownloading(null);
            loadingStateSetters.setVideoProgress(0);

            try {
                const finalFiles = await ffmpeg.listDir("/");
                if (finalFiles.some((file) => file.name === gifFilename)) {
                    await ffmpeg.deleteFile(gifFilename);
                }
                if (finalFiles.some((file) => file.name === videoFilename)) {
                    await ffmpeg.deleteFile(videoFilename);
                }
            } catch (cleanupError) {
                console.error("Error during FFmpeg cleanup:", cleanupError);
            }
        }
    };

    const body = (
        <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
            <div className="window w-full max-w-md p-6 md:p-8 space-y-6">
                <div className="title-bar">
                    <div className="title-bar-text text-xl font-bold text-white">Image Fragmenter</div>
                </div>
                <div className="window-body">
                    <input type="file" accept="image/jpeg,image/png" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                    {!imagePreview && (
                        <div className="field-row flex flex-col justify-center m-4">
                            <button onClick={() => fileInputRef.current.click()} className="w-full flex flex-col items-center justify-center hover:scale-105">
                                <img src={mouse} alt="cursor icon with speed lines" className="w-10 h-10 m-2" />
                                <span className="m-2 text-neutral-800 text-sm">Click to Upload Image</span>
                            </button>
                        </div>
                    )}

                    {imagePreview && generatedFrames.length === 0 && (
                        <div className="w-full flex flex-col justify-center items-center">
                            <img src={imagePreview} alt="Preview" className="max-w-[80%] max-h-[350px]  rounded-sm border-2 border-black" />
                            <button onClick={resetImage} disabled={allBusy} className="flex items-center justify-center mt-4 text-neutral-800 text-sm">
                                <TbTrash className="w-5 h-4 mr-1" /> Delete
                            </button>
                        </div>
                    )}

                    {originalImage && generatedFrames.length === 0 && (
                        <>
                            <FrameCountField frameCount={frameCount} setFrameCount={setFrameCount} disabled={allBusy} />
                            <button onClick={generateFrames} disabled={allBusy} className="w-full mt-4 p-2 text-sm flex items-center justify-center disabled:cursor-not-allowed">
                                {(loadingStates.isProcessing || loadingStates.isRenderingGif) && <TbBolt className="w-5 h-5 mr-2 animate-pulse" />}
                                {loadingStates.isProcessing ? "Generating..." : loadingStates.isRenderingGif ? "Rendering..." : "Generate Art"}
                            </button>
                        </>
                    )}

                    {generatedFrames.length > 0 && !loadingStates.isProcessing && (
                        <div className="w-full flex flex-col justify-center items-center space-y-4">
                            <p className="text-neutral-800 text-sm">Preview:</p>
                            <canvas ref={canvasRef} className="max-w-[80%] max-h-[350px] rounded-sm border-2 border-black" />
                            <DelaySlider gifDelay={gifDelay} setGifDelay={setGifDelay} disabled={allBusy} />
                            <EffectControls effects={effects} setters={effectSetters} disabled={allBusy} />
                        </div>
                    )}

                    <div className="text-center text-base text-neutral-800 min-h-5 m-5">{loadingStates.status}</div>

                    {loadingStates.isDownloading === "gif" && <ProgressBar type="gif" gifProgress={loadingStates.gifProgress} videoProgress={loadingStates.videoProgress} />}

                    {loadingStates.isDownloading === "video" && <ProgressBar type="video" gifProgress={loadingStates.gifProgress} videoProgress={loadingStates.videoProgress} />}

                    {generatedFrames.length > 0 && <DownloadPanel downloadFunctions={{ downloadZip, downloadGif, downloadVideo }} allBusy={allBusy} />}
                </div>
            </div>
            <div className="w-full max-w-md flex flex-row justify-between items-center mt-5">
                <button onClick={openModal} className="flex flex-row items-center justify-center text-neutral-800 text-sm p-1 mx-2">
                    <img src={help} alt="paper with question mark" className="h-6 mr-1" /> Help
                </button>
                {generatedFrames.length > 0 && (
                    <button onClick={startOver} className="flex items-center justify-center text-neutral-800 text-sm p-1 mx-2">
                        <img src={trash} alt="recycle bin" className="w-5 h-6 mr-1" /> Start Over
                    </button>
                )}
            </div>
            <HelpDialog isOpen={isModalOpen} onClose={closeModal} />
        </main>
    );

    return <Layout body={body} />;
}
