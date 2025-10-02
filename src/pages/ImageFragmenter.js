import { useEffect, useState, useRef } from "react";
import applyEffects from "../utils/imageEffects";
import { useImageEffects } from "../hooks/useImageEffects";
import { useLoadingStates } from "../hooks/useLoadingStates";
import { useDownloader } from "../hooks/useDownloader";
import { useFrameGenerator } from "../hooks/useFrameGenerator";

// UTILITY
import { FFmpeg } from "@ffmpeg/ffmpeg";
import { toBlobURL } from "@ffmpeg/util";
import heic2any from "heic2any";

// ICONS
import mouse from "../assets/mouse_speed.png";
import trash from "../assets/recycle_bin_full-2.png";
import help from "../assets/help_sheet-0.png";
import construction from "../assets/construction.gif";
import { TbBolt, TbTrash } from "react-icons/tb";

// UI COMPONENTS
import HelpDialog from "../components/HelpDialog";
import EffectControls from "../components/EffectControls";
import DownloadPanel from "../components/DownloadPanel";
import ProgressBar from "../components/ProgressBar";
import Layout from "../layouts/layout";
import DelaySlider from "../components/DelaySlider";
import InitialControls from "../components/InitialControls";
import MobileDownloadLink from "../components/MobileDownloadLink";

export default function ImageFragmenter() {
    const [originalImage, setOriginalImage] = useState(null);
    const [imagePreview, setImagePreview] = useState("");
    const [preloadedImages, setPreloadedImages] = useState([]);
    const [frameCount, setFrameCount] = useState(40);
    const [gifDelay, setGifDelay] = useState(100);
    const [outputDimensions, setOutputDimensions] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [noBg, setNoBg] = useState(false);
    const [mobileDownloadLink, setMobileDownloadLink] = useState(null);

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

    // Hooks
    const { effects, ...effectSetters } = useImageEffects();
    const { loadingStates, ...loadingStateSetters } = useLoadingStates();
    const { generatedFrames, setGeneratedFrames, generateFrames, generateFinalGifBlob } = useFrameGenerator({
        isCancelledRef,
        gifRef,
        gifCacheRef,
        loadingStateSetters,
        effects,
        outputDimensions,
        setOutputDimensions,
    });
    const { handleDownload } = useDownloader({
        preloadedImages,
        outputDimensions,
        effects,
        gifDelay,
        generateFinalGifBlob,
        ffmpeg,
        ffmpegRead,
        isCancelledRef,
        loadingStateSetters,
        noBg,
        setMobileDownloadLink,
    });

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
            const ctx = canvas.getContext("2d", { willReadFrequently: true, alpha: true });
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

    const handleFileSelect = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const acceptedTypes = ["image/jpeg", "image/png", "image/heic", "image/heif"];
        const isHeic = file.type.includes("heic") || file.type.includes("heif") || file.name.toLowerCase().endsWith(".heic") || file.name.toLowerCase().endsWith(".heif");
        if (!acceptedTypes.includes(file.type) && !isHeic) {
            loadingStateSetters.setStatus("Unsupported file type. Please use JPG, PNG, or HEIC.");
            return;
        }

        let blobToProcess = file;

        // if HEIC, convert to JPEG
        if (isHeic) {
            loadingStateSetters.setStatus("Converting HEIC to JPEG...");
            loadingStateSetters.setIsProcessing(true);
            try {
                const convertedBlob = await heic2any({
                    blob: file,
                    toType: "image/jpeg",
                    quality: 0.9,
                });
                blobToProcess = convertedBlob;
            } catch (error) {
                console.error("Error converting HEIC file:", error);
                loadingStateSetters.setStatus("Could not convert HEIC file to JPEG.");
                return;
            }
            loadingStateSetters.setIsProcessing(false);
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
        reader.readAsDataURL(blobToProcess);
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
        setNoBg(false);
        setOutputDimensions(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = null;
        }
        setMobileDownloadLink(null);

        loadingStateSetters.setStatus("Select an image to start.");
        loadingStateSetters.setIsProcessing(false);
        loadingStateSetters.setIsDownloading(null);
        loadingStateSetters.setGifProgress(0);
        loadingStateSetters.setVideoProgress(0);

        setGifDelay(100);
        loadingStateSetters.setIsRenderingGif(false);

        effectSetters.resetEffects();
    };

    const body = (
        <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
            <div className="window w-full max-w-md p-6 md:p-8 space-y-6">
                <div className="title-bar">
                    <div className="title-bar-text text-xl font-bold text-white">Image Fragmenter</div>
                </div>
                <div className="window-body">
                    <input type="file" accept="image/jpeg,image/png,image/heic,image/heif" ref={fileInputRef} onChange={handleFileSelect} className="hidden" />

                    {!imagePreview && (
                        <div className="field-row flex flex-col justify-center m-4">
                            <button
                                onClick={() => fileInputRef.current.click()}
                                disabled={allBusy}
                                className="w-full flex flex-col items-center justify-center hover:scale-105 disabled:pointer-events-none"
                            >
                                <img src={mouse} alt="cursor icon with speed lines" className="w-10 h-10 m-2" />
                                <span className="m-2 text-neutral-800 text-sm">Click to Upload Image</span>
                            </button>
                            {loadingStates.isProcessing && <img src={construction} alt="construction man" className="w-20 h-auto mr-1" />}
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
                            <InitialControls frameCount={frameCount} setFrameCount={setFrameCount} disabled={allBusy} backgroundState={{ noBg, setNoBg }} />
                            <button
                                onClick={() => generateFrames(originalImage, frameCount, noBg)}
                                disabled={allBusy}
                                className="w-full mt-4 p-2 text-sm flex items-center justify-center disabled:cursor-not-allowed"
                            >
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

                    {generatedFrames.length > 0 && (
                        <>
                            <MobileDownloadLink linkInfo={mobileDownloadLink} setter={setMobileDownloadLink} />
                            <DownloadPanel
                                downloadFunctions={{ downloadZip: () => handleDownload("zip"), downloadGif: () => handleDownload("gif"), downloadVideo: () => handleDownload("video") }}
                                allBusy={allBusy}
                                noBg={noBg}
                            />
                        </>
                    )}
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
