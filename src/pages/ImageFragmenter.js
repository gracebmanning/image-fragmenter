import '98.css';
import { useState, useRef } from 'react';
import { TbBolt, TbDownload, TbTrash } from "react-icons/tb";
import JSZip from 'jszip';
import GIF from 'gif.js';
import * as Mp4Muxer from 'mp4-muxer';

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
    const [frameCount, setFrameCount] = useState(40);
    const [outputDimensions, setOutputDimensions] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Status and Loading State
    const [status, setStatus] = useState('Select an image to start.');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(null); // 'zip','video', or null ('gif' not needed)
    const [gifProgress, setGifProgress] = useState(0);
    const [videoProgress, setVideoProgress] = useState(0);
    
    // Refs
    const fileInputRef = useRef(null);

    // Interactive GIF State
    const [gifDelay, setGifDelay] = useState(100);
    const [gifPreviewUrl, setGifPreviewUrl] = useState('');
    const [lastGifBlob, setLastGifBlob] = useState(null);
    const [isRenderingGif, setIsRenderingGif] = useState(false);

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
                setGifPreviewUrl('');
                setLastGifBlob(null);
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
        setFrameCount(40);
        setOutputDimensions(null);

        setStatus('Select an image to start.');
        setIsProcessing(false);
        setIsDownloading(null);
        setGifProgress(0);
        setVideoProgress(0);

        setGifDelay(100);
        setGifPreviewUrl('');
        setLastGifBlob(null);
        setIsRenderingGif(false);
    }

    const generateFrames = async () => {
        if (!originalImage) return;

        setIsProcessing(true);
        setGifPreviewUrl('');
        setLastGifBlob(null);
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
            const scalingCtx = scalingCanvas.getContext('2d');
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
        renderGifPreview(gifDelay, frames, newOutputDimensions);
    };

    const renderGifPreview = async (delay, framesToRender = generatedFrames, dimensions = outputDimensions) => {
        if (framesToRender.length === 0) return;
        setIsRenderingGif(true);
        setGifProgress(0);
        setStatus('Rendering GIF preview...');

        const { width, height } = dimensions || outputDimensions || { width: originalImage.width, height: originalImage.height };

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
            setStatus(`Rendering preview: ${progressPercent}%`);
        });

        const imageElements = await Promise.all(framesToRender.map(blob => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = URL.createObjectURL(blob);
            });
        }));

        imageElements.forEach(img => {
            gif.addFrame(img, { delay: delay });
            URL.revokeObjectURL(img.src);
        });

        gif.on('finished', (blob) => {
            const url = URL.createObjectURL(blob);
            setGifPreviewUrl(url);
            setLastGifBlob(blob);
            setIsRenderingGif(false);
            setGifProgress(100);
            setStatus('Adjust speed with the slider, then download!');
        });

        gif.render();
    };

    const getCanvasBlob = (canvas) => {
        return new Promise(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.9));
    };
    
    const triggerDownload = (blob, filename) => {
        const url = URL.createObjectURL(blob);
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
        triggerDownload(zipBlob, 'glitch-images.zip');
        setStatus('ZIP download started!');
        setIsDownloading(null);
    };

    const downloadGif = () => {
        setStatus('GIF download started!');
        triggerDownload(lastGifBlob, `animation_${gifDelay}ms.gif`);
    };

    const downloadVideo = async () => {
        if (!('VideoEncoder' in window)) {
            setStatus('WebCodecs API not supported in this browser.');
            return;
        }
        if (!generatedFrames.length || !originalImage) return;

        setIsDownloading('video');
        setStatus('Initializing video encoder...');
        setVideoProgress(0);

        const frameRate = Math.round(1000 / gifDelay);
        const { width, height } = outputDimensions || { width: originalImage.width, height: originalImage.height };

        try {
            let muxer = new Mp4Muxer.Muxer({
                target: new Mp4Muxer.ArrayBufferTarget(),
                fastStart: 'in-memory',
                video: {
                    codec: 'avc',
                    width: width,
                    height: height,
                },
            });

            let encoder = new VideoEncoder({
                output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
                error: (e) => console.error('VideoEncoder error:', e),
            });

            encoder.configure({
                codec: 'avc1.4D0028', // Level 4.0 H.264 'Main' profile codec
                width: width,
                height: height,
                framerate: frameRate,
                bitrate: 5_000_000
            });

            for (const [index, blob] of generatedFrames.entries()) {
                setStatus(`Encoding frame ${index + 1} of ${generatedFrames.length}...`);
                const bitmap = await createImageBitmap(blob);
                const timestamp = index * (1_000_000 / frameRate);
                const duration = 1_000_000 / frameRate;
                const frame = new VideoFrame(bitmap, { timestamp: timestamp, duration: duration });
                
                encoder.encode(frame);
                frame.close();

                setVideoProgress(Math.round(((index + 1) / generatedFrames.length) * 100));
            }

            setStatus('Finalizing video file...');
            await encoder.flush();
            let buffer = muxer.finalize();

            const videoBlob = new Blob([buffer], { type: 'video/mp4' });
            triggerDownload(videoBlob, `animation_${gifDelay}ms.mp4`);

            setStatus('Video download started!');
        } catch (error) {
            console.error('Error creating video:', error);
            setStatus('Failed to create video. See console for details.');
        } finally {
            setIsDownloading(null);
            setVideoProgress(0);
        }
    };

    const allBusy = isProcessing || isDownloading || isRenderingGif;

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center">
            <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
                <button onClick={openModal} disabled={allBusy} className="flex items-center justify-center text-neutral-800 text-sm mb-4">
                    <img src={help} alt="paper with question mark" className="h-5 m-1" />
                    <span className="m-1 text-neutral-800 text-sm">Help</span>
                </button>
                <HelpDialog isOpen={isModalOpen} onClose={closeModal} />
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

                        {imagePreview && !gifPreviewUrl && (
                             <div className="w-full flex flex-col justify-center items-center">
                                <img src={imagePreview} alt="Preview" className="w-[50%] h-auto rounded-sm border-2 border-black" />
                                <button onClick={resetImage} disabled={allBusy} className="flex items-center justify-center mt-4 text-neutral-800 text-sm">
                                    <TbTrash className="w-5 h-4 mr-1" /> Delete
                                </button>
                            </div>
                        )}

                        {originalImage && !gifPreviewUrl && (
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

                        {gifPreviewUrl && !isRenderingGif && (
                             <div className="w-full flex flex-col justify-center items-center space-y-4">
                                <p className="text-neutral-800 text-sm">Preview:</p>
                                <img src={gifPreviewUrl} alt="GIF Preview" className="w-[80%] h-auto rounded-sm border-2 border-black" />
                                <div className="field-row-stacked w-[80%]">
                                    <label htmlFor="delaySlider" className="text-sm font-medium text-neutral-800">Delay: {gifDelay}ms</label>
                                    <input id="delaySlider" type="range" min="10" max="1000" step="10" value={gifDelay} onChange={(e) => setGifDelay(Number(e.target.value))} disabled={isRenderingGif || isDownloading}/>
                                </div>
                                <button onClick={() => renderGifPreview(gifDelay)} disabled={allBusy} className="p-2 text-sm disabled:cursor-not-allowed">
                                    Update Preview
                                </button>
                            </div>
                        )}

                        <div className="text-center text-base text-neutral-800 min-h-5 m-4">{status}</div>
                        
                        {/* GIF PROGRESS BAR */}
                        {isRenderingGif && (
                            <div className="w-full mt-4 mb-4 flex flex-col justify-evenly items-center">
                                <img src={construction} alt="construction man" className="w-20 h-auto mr-1" />
                                <div className="progress-indicator segmented w-full mt-4 h-2.5 my-2">
                                    <span className="progress-indicator-bar" style={{width: `${gifProgress}%`}} />
                                </div>
                            </div>
                        )}

                        {/* VIDEO PROGRESS BAR */}
                        {isDownloading === 'video' && (
                            <div className="progress-indicator segmented mt-4 h-2.5 my-2">
                                <span className="progress-indicator-bar" style={{width: `${videoProgress}%`}} />
                            </div>
                        )}

                        {lastGifBlob && (
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
                {lastGifBlob && (
                    <div className="w-full mt-5 flex flex-row justify-center items-center">
                        <button onClick={startOver} className="flex items-center justify-center text-neutral-800 text-sm p-1">
                            <img src={trash} alt="recycle bin" className="w-5 h-6 mr-1" /> Start Over
                        </button>
                    </div>
                )}
            </main>
            <footer className="w-full font-sans text-base bg-neutral-300 text-neutral-600 flex flex-col items-center justify-center p-4">
                <p className="mb-1">Created by <a href="https://graceis.online/" target="_blank" rel="noreferrer" className="underline">Grace Manning</a>.</p>
                <p className="mb-1">Enjoyed it? Send a <a href="https://ko-fi.com/graceisonline" target="_blank" rel="noreferrer" className="underline">thank you</a> :-)</p>
                <img src={globe} alt="earth globe with mouse pointer" className="w-5 h-5" />
            </footer>
        </div>
    );
}
