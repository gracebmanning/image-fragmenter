import '98.css';
import { useEffect, useState, useRef } from 'react';
import { TbBolt, TbDownload, TbTrash } from "react-icons/tb";
import JSZip from 'jszip';
import GIF from 'gif.js';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

import mouse from '../assets/mouse_speed.png';
import globe from '../assets/internet_connection_wiz-0.png';
import trash from '../assets/recycle_bin_full-2.png';
import construction from '../assets/construction.gif';
import help from '../assets/help_sheet-0.png';
import HelpDialog from './HelpDialog';

export default function ImageFragmenter() {
    const [originalImage, setOriginalImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [generatedFrames, setGeneratedFrames] = useState([]);
    const [preloadedImages, setPreloadedImages] = useState([]);
    const [frameCount, setFrameCount] = useState(40);
    const [outputDimensions, setOutputDimensions] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Status and Loading State
    const [status, setStatus] = useState('Select an image to start.');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(null); // 'zip','video', 'gif', null
    const [gifProgress, setGifProgress] = useState(0);
    const [videoProgress, setVideoProgress] = useState(0); 

    // Interactive GIF State
    const [gifDelay, setGifDelay] = useState(100);
    const [isRenderingGif, setIsRenderingGif] = useState(false);

    // FFmpeg State
    const [ffmpeg, setFfmpeg] = useState(null);
    const [ffmpegRead, setFfmpegReady] = useState(false);

    // Refs
    const fileInputRef = useRef(null);
    const canvasRef = useRef(null);
    const playbackTimeoutIdRef = useRef(null);

    // FILENAMES
    const zipFilename = `glitch-images.zip`;
    const gifFilename = `animation_${gifDelay}ms.gif`;
    const videoFilename = `animation_${gifDelay}ms.mp4`;

    const allBusy = isProcessing || isDownloading || isRenderingGif;

    useEffect(() => {
        const loadFfmpeg = async () => {
            const ffmpegInstance = new FFmpeg();
            const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
            await ffmpegInstance.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
            setFfmpeg(ffmpegInstance);
            setFfmpegReady(true);
        };
        loadFfmpeg();
    }, []);

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
        Promise.all(generatedFrames.map(blob => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = URL.createObjectURL(blob);
            })
        })).then(images => {
            if(isActive){
                //currentImages = images;
                setPreloadedImages(images);
            }
        });

        return() => {
            isActive = false;
            //currentImages.forEach(img => URL.revokeObjectURL(img.src));
        }
    }, [generatedFrames])

    // handle the animation playback loop
    useEffect(() => {
        // clear the previous loop before starting a new one
        if (playbackTimeoutIdRef.current) {
            clearTimeout(playbackTimeoutIdRef.current);
        }

        // run animation
        if(preloadedImages.length > 0 && canvasRef.current && !allBusy){
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d', { willReadFrequently: true });
            const { width, height } = outputDimensions;
            canvas.width = width;
            canvas.height = height;

            let frameIndex = 0;

            const nextFrame = () => {
                if (!canvasRef.current || preloadedImages.length === 0) return;
                
                // draw the current preloaded image
                ctx.drawImage(preloadedImages[frameIndex], 0, 0, width, height);
                
                // move to the next frame
                frameIndex = (frameIndex + 1) % preloadedImages.length;
                
                // schedule the next frame draw with the current delay
                playbackTimeoutIdRef.current = setTimeout(nextFrame, gifDelay);
            }

            nextFrame();
        }

        return() => {
            clearTimeout(playbackTimeoutIdRef.current);
        }
    }, [preloadedImages, gifDelay, allBusy, outputDimensions])

    const openModal = () => setIsModalOpen(true);
    const closeModal = () => setIsModalOpen(false);

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if(!file) return;
        if (!['image/png', 'image/jpeg'].includes(file.type)){
            setStatus('Unsupported file type.');
            return;
        } 
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                setOriginalImage(img);
                setImagePreview(e.target.result);
                setStatus('Image loaded. Ready to generate.');
                setGeneratedFrames([]);
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const resetImage = () => {
        setOriginalImage(null);
        setImagePreview(null);
    }

    const startOver = () => {
        setOriginalImage(null);
        setImagePreview('');
        setGeneratedFrames([]);
        setPreloadedImages([]);
        setFrameCount(40);
        setOutputDimensions(null);

        setStatus('Select an image to start.');
        setIsProcessing(false);
        setIsDownloading(null);
        setGifProgress(0);
        setVideoProgress(0);

        setGifDelay(100);
        setIsRenderingGif(false);
    }

    const generateFrames = async () => {
        if (!originalImage) return;

        setIsProcessing(true);
        setStatus('Preparing image...');

        const maxWidth = 1920;
        const maxHeight = 1080;
        let imageToProcess = originalImage;
        let finalWidth = originalImage.width;
        let finalHeight = originalImage.height;

        if(originalImage.width > maxWidth || originalImage.height > maxHeight){
            setStatus('Image is large, scaling for compatibility...');
            const scaleFactor = Math.min(maxWidth / originalImage.width, maxHeight / originalImage.height);
            finalWidth = Math.floor(originalImage.width * scaleFactor);
            finalHeight = Math.floor(originalImage.height * scaleFactor);

            const scalingCanvas = document.createElement('canvas');
            scalingCanvas.width = finalWidth;
            scalingCanvas.height = finalHeight;
            const scalingCtx = scalingCanvas.getContext('2d', { willReadFrequently: true });
            scalingCtx.drawImage(originalImage, 0, 0, finalWidth, finalHeight);
            imageToProcess = scalingCanvas;
        }

        // H264 only supports even sized frames
        if (finalWidth % 2 !== 0) finalWidth--;
        if (finalHeight % 2 !== 0) finalHeight--;

        const newOutputDimensions = { width: finalWidth, height: finalHeight };
        setOutputDimensions(newOutputDimensions);

        const frames = [];
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        canvas.width = finalWidth;
        canvas.height = finalHeight;
        ctx.drawImage(imageToProcess, 0, 0);

        frames.push(await getCanvasBlob(canvas));

        for (let i = 0; i < frameCount; i++) {
            const cropWidth = Math.floor(Math.random() * canvas.width) + 1;
            const cropHeight = Math.floor(Math.random() * canvas.height) + 1;

            const left = Math.floor(Math.random() * (canvas.width - cropWidth + 1));
            const top = Math.floor(Math.random() * canvas.height - cropHeight + 1);

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropWidth;
            cropCanvas.height = cropHeight;
            cropCanvas.getContext('2d', { willReadFrequently: true }).drawImage(imageToProcess, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            
            const pasteX = Math.floor(Math.random() * (canvas.width - cropWidth + 1));
            const pasteY = Math.floor(Math.random() * (canvas.height - cropHeight + 1));
            ctx.drawImage(cropCanvas, pasteX, pasteY);

            frames.push(await getCanvasBlob(canvas));
            setStatus(`Generating frame ${i + 1} of ${frameCount}...`);
        }
        
        setGeneratedFrames(frames);
        setIsProcessing(false);
        setStatus('Preview ready. Adjust speed with the slider!');
    };

    const generateFinalGifBlob = (delay) => {
        return new Promise(async(resolve, reject) => {
            if (generatedFrames.length === 0) {
                reject(new Error("No frames to render."));
                return;
            }

            setIsRenderingGif(true);
            setGifProgress(0);
            setStatus('Rendering GIF...');

            const { width, height } = outputDimensions;
            const gif = new GIF({
                workers: 4,
                quality: 10,
                width: width,
                height: height,
                workerScript: '/js/gif.worker.js',
            });

            gif.on('progress', (p) => {
                const progressPercent = Math.round(p * 100);
                setGifProgress(progressPercent);
                setStatus(`Rendering GIF: ${progressPercent}%`);
            });

            gif.on('finished', (blob) => {
                setIsRenderingGif(false);
                setGifProgress(100);
                setStatus('GIF Rendered!');
                resolve(blob);
            });

            const imageElements = await Promise.all(generatedFrames.map(blob => {
                return new Promise(resolveImg => {
                    const img = new Image();
                    img.onload = () => resolveImg(img);
                    img.src = URL.createObjectURL(blob);
                });
            }));

            imageElements.forEach(img => {
                gif.addFrame(img, { delay: delay });
                URL.revokeObjectURL(img.src);
            });

            gif.render();
        });
    };

    const getCanvasBlob = (canvas) => {
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    };
    
    const triggerDownload = async (blob, filename) => {
        const file = new File([blob], filename, { type: blob.type });

        // use Web Share API (if available)
        if(navigator.share && navigator.canShare({ files: [file] })){
            try{
                await navigator.share({
                    files: [file],
                    title: 'my fragmented image',
                    text: 'check out this animation!'
                });
                setStatus('Shared successfully!');
            } catch(error){
                console.log('Share was cancelled or failed', error);
            }
        }

        // iOS/mobile fallback: open in new tab
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        console.log(navigator.userAgent);
        const url = URL.createObjectURL(blob);

        if(isIOS){
            window.open(url, '_blank');
            URL.revokeObjectURL(url);
            return;
        }

        // fallback for desktops
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const downloadZip = async () => {
        if (typeof JSZip === 'undefined') {
            alert('JSZip library not loaded yet. Please wait.');
            return;
        }
        setIsDownloading('zip');
        setStatus('Creating ZIP file...');
        const zip = new JSZip();
        generatedFrames.forEach((blob, i) => {
            zip.file(`frame_${String(i).padStart(4, '0')}.jpg`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, zipFilename);
        setStatus('ZIP download started!');
        setIsDownloading(null);
    };

    const downloadGif = async () => {
        setIsDownloading('gif');
        try{
            const finalGifBlob = await generateFinalGifBlob(gifDelay);
            triggerDownload(finalGifBlob, gifFilename);
            setStatus('GIF download started!');
        } catch(error){
            console.error('Failed to generate GIF:', error);
            setStatus('Error creating GIF. See console.');
        }
        setIsDownloading(null);
    };

    const downloadVideo = async () => {
        if(!ffmpegRead || !ffmpeg){
            setStatus('FFmpeg is not loaded yet. Please wait.');
            return;
        }

        setIsDownloading('video');
        setVideoProgress(0);

        try{
            setStatus('Rendering GIF for video conversion...');
            const finalGifBlob = await generateFinalGifBlob(gifDelay); 
            
            const files = await ffmpeg.listDir('/');
            if (files.some(file => file.name === gifFilename)) {
                await ffmpeg.deleteFile(gifFilename);
            }
            if (files.some(file => file.name === videoFilename)) {
                await ffmpeg.deleteFile(videoFilename);
            }
            
            await ffmpeg.writeFile(gifFilename, await fetchFile(finalGifBlob));
            
            setStatus('Converting GIF to MP4...');
            ffmpeg.on('progress', ({ progress }) => {
                setVideoProgress(Math.min(100, Math.round(progress * 100)));
            });

            await ffmpeg.exec([
                '-i', gifFilename,              // Input file
                '-movflags', '+faststart',      // Optimizes for web playback
                '-c:v', 'libx264',              // Video codec
                '-pix_fmt', 'yuv420p',          // Crucial for compatibility
                videoFilename                   // Output file
            ])

            setStatus('Finalizing video file...');
            const data = await ffmpeg.readFile(videoFilename);
            const videoBlob = new Blob([data], {type: 'video/mp4'});
            triggerDownload(videoBlob, videoFilename);
            setStatus('Video download started!');

        } catch(error){
            console.error('Error converting GIF to video with FFmpeg:', error);
            setStatus('Failed to create video. See console.');
        } finally{
            setIsDownloading(null);
            setVideoProgress(0);

            try{
                const finalFiles = await ffmpeg.listDir('/');
                if (finalFiles.some(file => file.name === gifFilename)) {
                    await ffmpeg.deleteFile(gifFilename);
                }
                if (finalFiles.some(file => file.name === videoFilename)) {
                    await ffmpeg.deleteFile(videoFilename);
                }
            } catch(cleanupError){
                console.error('Error during FFmpeg cleanup:', cleanupError);
            }
        }
    };

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center">
            <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
                <div className="window w-full max-w-md p-6 md:p-8 space-y-6">
                    <div className="title-bar">
                        <div className="title-bar-text text-xl font-bold text-white">Image Fragmenter</div>
                    </div>
                    <div className="window-body">                   
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />

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
                                <img src={imagePreview} alt="Preview" className="w-[70%] h-auto  rounded-sm border-2 border-black" />
                                <button onClick={resetImage} disabled={allBusy} className="flex items-center justify-center mt-4 text-neutral-800 text-sm">
                                    <TbTrash className="w-5 h-4 mr-1" /> Delete
                                </button>
                            </div>
                        )}

                        {originalImage && generatedFrames.length === 0 && (
                            <>
                                <div className="field-row mt-4">
                                    <label htmlFor="frameCount" className="text-sm font-medium text-neutral-800">Frames</label>
                                    <input id="frameCount" type="number" value={frameCount} onChange={(e) => setFrameCount(Number(e.target.value))} className="text-neutral-700 text-xs" disabled={allBusy}/>
                                </div>
                                <button onClick={generateFrames} disabled={allBusy} className="w-full mt-4 p-2 text-sm flex items-center justify-center disabled:cursor-not-allowed">
                                    {(isProcessing || isRenderingGif) && <TbBolt className="w-5 h-5 mr-2 animate-pulse" />}
                                    {isProcessing ? 'Generating...' : (isRenderingGif ? 'Rendering...' : 'Generate Art')}
                                </button>
                            </>
                        )}

                        {generatedFrames.length > 0 && !isProcessing && (
                             <div className="w-full flex flex-col justify-center items-center space-y-4">
                                <p className="text-neutral-800 text-sm">Preview:</p>
                                <canvas ref={canvasRef} className="max-w-[80%] max-h-[350px] rounded-sm border-2 border-black" />
                                <div className="field-row-stacked w-[80%]">
                                    <label htmlFor="delaySlider" className="text-sm font-medium text-neutral-800">Delay: {gifDelay}ms</label>
                                    <input id="delaySlider" type="range" min="10" max="1000" step="10" value={gifDelay} onChange={(e) => setGifDelay(Number(e.target.value))} disabled={isRenderingGif || isDownloading}/>
                                </div>
                            </div>
                        )}

                        <div className="text-center text-base text-neutral-800 min-h-5 m-4">{status}</div>
                        
                        {/* GIF PROGRESS BAR */}
                        {isDownloading === 'gif' && (
                            <div className="w-full mt-4 mb-4 flex flex-col justify-evenly items-center">
                                <img src={construction} alt="construction man" className="w-20 h-auto mr-1" />
                                <div className="progress-indicator segmented w-full mt-4 h-2.5 my-2">
                                    <span className="progress-indicator-bar" style={{width: `${gifProgress}%`}} />
                                </div>
                            </div>
                        )}

                        {/* VIDEO PROGRESS BAR */}
                        {isDownloading === 'video' && (
                            <div className="w-full mt-4 mb-4 flex flex-col justify-evenly items-center">
                                <img src={construction} alt="construction man" className="w-20 h-auto mr-1" />
                                <div className="progress-indicator segmented w-full mt-4 h-2.5 my-2">
                                    <span className="progress-indicator-bar" style={{width: `${(gifProgress + videoProgress)/2}%`}} />
                                </div>
                            </div>
                        )}

                        {generatedFrames.length > 0 && (
                            <div className="field-row w-full mt-4 mb-4 flex flex-row justify-evenly items-center">
                                <button onClick={downloadZip} disabled={allBusy} className="flex items-center justify-center text-neutral-800 text-sm">
                                    <TbDownload className="w-5 h-4 mr-1" /> ZIP
                                </button>
                                <button onClick={downloadGif} disabled={allBusy} className="flex items-center justify-center text-neutral-800 text-sm">
                                    <TbDownload className="w-5 h-4 mr-1" /> GIF
                                </button>
                                <button onClick={downloadVideo} disabled={allBusy} className="flex items-center justify-center text-neutral-800 text-sm">
                                    <TbDownload className="w-5 h-4 mr-1" /> Video
                                </button>
                            </div>
                        )}

                    </div>
                </div>
                <div className="w-full max-w-md flex flex-row justify-between items-center mt-5">
                    {generatedFrames.length > 0 && (
                        <button onClick={startOver} disabled={allBusy} className="flex items-center justify-center text-neutral-800 text-sm p-1 mx-2">
                            <img src={trash} alt="recycle bin" className="w-5 h-6 mr-1" /> Start Over
                        </button>
                    )}
                    <button onClick={openModal} disabled={allBusy} className="flex flex-row items-center justify-center text-neutral-800 text-sm p-1 mx-2">
                        <img src={help} alt="paper with question mark" className="h-6 mr-1" /> Help
                    </button>
                </div>
                <HelpDialog isOpen={isModalOpen} onClose={closeModal} />
            </main>
            <footer className="w-full font-sans text-base bg-neutral-300 text-neutral-600 flex flex-col items-center justify-center p-4">
                <p className="mb-1">Created by <a href="https://graceis.online/" target="_blank" rel="noreferrer" className="underline">Grace Manning</a>.</p>
                <p className="mb-1">Enjoyed it? Send a <a href="https://ko-fi.com/graceisonline" target="_blank" rel="noreferrer" className="underline">thank you</a>!</p>
                <img src={globe} alt="earth globe with mouse pointer" className="w-5 h-5" />
            </footer>
        </div>
    );
}