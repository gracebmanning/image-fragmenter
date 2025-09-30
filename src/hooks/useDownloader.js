import JSZip from "jszip";
import { fetchFile } from "@ffmpeg/util";
import applyEffects from "../utils/imageEffects";

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
        } catch (error) {
            // catch if the user cancels the share.
            // don't need a fallback here because cancelling is intentional.
            console.log("Share was cancelled or failed", error);
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

export const useDownloader = ({ preloadedImages, outputDimensions, effects, gifDelay, generateFinalGifBlob, ffmpeg, ffmpegRead, isCancelledRef, loadingStateSetters }) => {
    const zipFilename = `glitch-images.zip`;
    const gifFilename = `animation_${gifDelay}ms.gif`;
    const videoFilename = `animation_${gifDelay}ms.mp4`;

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
        const tempCtx = tempCanvas.getContext("2d", { willReadFrequently: true, alpha: true });

        // use preloadedImages as they are already decoded and ready to draw
        for (let i = 0; i < preloadedImages.length; i++) {
            const img = preloadedImages[i];

            tempCtx.clearRect(0, 0, width, height);
            tempCtx.drawImage(img, 0, 0, width, height);

            applyEffects(tempCtx, width, height, effects);

            const newBlob = await new Promise((resolve) => {
                if (effects.noBg) {
                    tempCanvas.toBlob(resolve, "image/png");
                } else {
                    tempCanvas.toBlob(resolve, "image/jpeg", 0.9);
                }
            });

            const fileExtension = effects.noBg ? ".png" : ".jpg";
            zip.file(`frame_${String(i).padStart(4, "0")}${fileExtension}`, newBlob);
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

    const handleDownload = async (type) => {
        isCancelledRef.current = false;
        loadingStateSetters.setIsDownloading(type);
        loadingStateSetters.setVideoProgress(0);

        try {
            if (type === "zip") await downloadZip();
            else if (type === "gif") await downloadGif();
            else if (type === "video") await downloadVideo();
        } catch (error) {
            console.error(`Failed to download ${type}:`, error);
        } finally {
        }
    };

    return { handleDownload };
};
