import '98.css';
import { useState, useRef } from 'react';
import { TbBolt, TbDownload } from "react-icons/tb";
import JSZip from 'jszip';
import GIF from 'gif.js';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import mouse from '../assets/mouse_speed.png';
import globe from '../assets/internet_connection_wiz-0.png';

export default function ImageFragmenter() {
    const [originalImage, setOriginalImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [generatedFrames, setGeneratedFrames] = useState([]);
    const [frameCount, setFrameCount] = useState(40);

    // Status and Loading State
    const [status, setStatus] = useState('Select an image to start.');
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(null); // 'zip','video', or null ('gif' not needed)
    const [gifProgress, setGifProgress] = useState(0);
    const [videoProgress, setVideoProgress] = useState(0);
    
    // Refs
    const fileInputRef = useRef(null);
    const ffmpegRef = useRef(null);

    // Interactive GIF State
    const [gifDelay, setGifDelay] = useState(100);
    const [gifPreviewUrl, setGifPreviewUrl] = useState('');
    const [lastGifBlob, setLastGifBlob] = useState(null);
    const [isRenderingGif, setIsRenderingGif] = useState(false);

    const loadFFmpeg = async () => {
        if (ffmpegRef.current && ffmpegRef.current.loaded) return;
        const ffmpeg = new FFmpeg();
        ffmpegRef.current = ffmpeg;
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd'
        try {
            await ffmpeg.load({
                coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
                wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
            });
        } catch (error) {
            console.error("FFmpeg loading failed:", error);
        }
    };

    const handleFileSelect = (event) => {
        const file = event.target.files[0];
        if (!file || !file.type.startsWith('image/')) return;
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
                loadFFmpeg();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const generateFrames = async () => {
        if (!originalImage) return;

        setIsProcessing(true);
        setGifPreviewUrl('');
        setLastGifBlob(null);
        setStatus('Generating frames...');
        const frames = [];
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        ctx.drawImage(originalImage, 0, 0);

        frames.push(await getCanvasBlob(canvas));

        for (let i = 0; i < frameCount; i++) {
            const left = Math.floor(Math.random() * canvas.width);
            const top = Math.floor(Math.random() * canvas.height);
            const cropWidth = Math.floor(Math.random() * (canvas.width - left));
            const cropHeight = Math.floor(Math.random() * (canvas.height - top));

            const cropCanvas = document.createElement('canvas');
            cropCanvas.width = cropWidth;
            cropCanvas.height = cropHeight;
            cropCanvas.getContext('2d').drawImage(originalImage, left, top, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);
            
            const pasteX = Math.floor(Math.random() * (canvas.width - cropWidth));
            const pasteY = Math.floor(Math.random() * (canvas.height - cropHeight));
            ctx.drawImage(cropCanvas, pasteX, pasteY);

            frames.push(await getCanvasBlob(canvas));
            setStatus(`Generating frame ${i + 1} of ${frameCount}...`);
        }
        
        setGeneratedFrames(frames);
        setIsProcessing(false);
        renderGifPreview(gifDelay, frames);
    };

    const renderGifPreview = async (delay, framesToRender = generatedFrames) => {
        if (framesToRender.length === 0) return;
        setIsRenderingGif(true);
        setGifProgress(0);
        setStatus('Rendering GIF preview...');

        const gif = new GIF({
            workers: 4,
            quality: 10,
            width: originalImage.width,
            height: originalImage.height,
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
        triggerDownload(lastGifBlob, 'animation.gif');
    };

    const downloadVideo = async () => {
        if (!ffmpegRef.current || !ffmpegRef.current.loaded) {
            setStatus('FFmpeg is not ready. Please wait a moment.');
            await loadFFmpeg();
            return;
        }
        if (typeof MediaRecorder === 'undefined') {
            setStatus('Video recording not supported in this browser.');
            return;
        }

        setIsDownloading('video');
        setVideoProgress(0);

        // Record frames to a WebM Blob
        setStatus('Recording frames...');
        const canvas = document.createElement('canvas');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');
        const stream = canvas.captureStream();
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        
        const recordingPromise = new Promise(resolve => {
            recorder.onstop = () => {
                const webmBlob = new Blob(chunks, { type: 'video/webm' });
                resolve(webmBlob);
            };
        });

        recorder.start();
        for (let i = 0; i < generatedFrames.length; i++) {
            const bmp = await createImageBitmap(generatedFrames[i]);
            ctx.drawImage(bmp, 0, 0);
            setStatus(`Recording frame ${i + 1} of ${generatedFrames.length}`);
            await new Promise(r => setTimeout(r, gifDelay));
        }
        recorder.stop();
        const webmBlob = await recordingPromise;

        // Transcode WebM to MP4 using FFmpeg
        const ffmpeg = ffmpegRef.current;
        ffmpeg.on('progress', ({ progress }) => {
            const progressPercent = Math.min(100, Math.round(progress * 100));
            setVideoProgress(progressPercent);
            setStatus(`Transcoding to MP4: ${progressPercent}%`);
        });

        setStatus('Writing file to memory...');
        await ffmpeg.writeFile('input.webm', new Uint8Array(await webmBlob.arrayBuffer()));
        
        setStatus('Transcoding to MP4...');
        await ffmpeg.exec(['-i', 'input.webm', '-c:v', 'libx264', 'output.mp4']);
        
        setStatus('Reading result...');
        const data = await ffmpeg.readFile('output.mp4');
        
        const mp4Blob = new Blob([data.buffer], { type: 'video/mp4' });
        triggerDownload(mp4Blob, 'animation.mp4');
        
        setStatus('MP4 download started!');
        await ffmpeg.terminate();
        ffmpegRef.current = null;
        
        setTimeout(() => {
            setIsDownloading(null);
            setVideoProgress(0);
            setStatus(`Adjust speed with the slider, then download!`);
        }, 2000);
    };

    const allBusy = isProcessing || isDownloading || isRenderingGif;

    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center">
            <main className="w-full bg-neutral-400 text-neutral-200 flex flex-col flex-grow items-center justify-center p-4">
                <div className="window w-full max-w-md p-6 md:p-8 space-y-6">

                    <div className="title-bar">
                        <div className="title-bar-text text-xl font-bold text-white">Image Fragmenter</div>
                        <div className="title-bar-controls">
                            <button aria-label="Minimize" />
                            <button aria-label="Maximize" />
                            <button aria-label="Close" />
                        </div>
                    </div>

                    <div className="window-body">
                        <p className="text-center text-lg text-neutral-800 mb-2">glitch your pics!!</p>
                    
                        <input
                            type="file"
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileSelect}
                            className="hidden"
                        />

                        {imagePreview && !gifPreviewUrl && (
                             <div className="w-full flex flex-col justify-center items-center">
                                <img src={imagePreview} alt="Preview" className="w-[50%] h-auto rounded-sm border-2 border-black" />
                            </div>
                        )}

                        {!imagePreview && (
                            <div className="field-row flex flex-col justify-center m-4">
                                <button onClick={() => fileInputRef.current.click()} className="w-full flex flex-col items-center justify-center hover:scale-105">
                                    <img src={mouse} alt="cursor icon with speed lines" className="w-10 h-10 m-2" />
                                    <span className="m-2 text-neutral-800 text-sm">Click to Upload Image</span>
                                </button>
                            </div>
                        )}

                        {originalImage && (
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

                        <div className="text-center text-base text-neutral-800 min-h-5 m-4">{status}</div>
                        
                        {/* GIF PROGRESS BAR */}
                        {isRenderingGif && (
                             <div className="progress-indicator segmented mt-4 h-2.5 my-2">
                                <span class="progress-indicator-bar" style={{width: `${gifProgress}%`}} />
                            </div>
                        )}

                        {gifPreviewUrl && !isRenderingGif && (
                             <div className="w-full flex flex-col justify-center items-center space-y-4">
                                <p className="text-neutral-800 text-sm">Preview:</p>
                                <img src={gifPreviewUrl} alt="GIF Preview" className="w-[80%] h-auto rounded-sm border-2 border-black" />
                                <div className="field-row-stacked w-[80%]">
                                    <label htmlFor="delaySlider" className="text-sm font-medium text-neutral-800">Delay: {gifDelay}ms</label>
                                    <input id="delaySlider" type="range" min="20" max="1000" step="10" value={gifDelay} onChange={(e) => setGifDelay(Number(e.target.value))} disabled={isRenderingGif || isDownloading}/>
                                </div>
                                <button onClick={() => renderGifPreview(gifDelay)} disabled={allBusy} className="p-2 text-sm disabled:cursor-not-allowed">
                                    Update Preview
                                </button>
                            </div>
                        )}

                        {/* VIDEO PROGRESS BAR */}
                        {isDownloading === 'video' && (
                            <div class="progress-indicator segmented mt-4 h-2.5 my-2">
                                <span class="progress-indicator-bar" style={{width: `${videoProgress}%`}} />
                            </div>
                        )}

                        {lastGifBlob && (
                            <div className="field-row w-full mt-4 mb-4 flex flex-row justify-evenly items-center border-neutral-700">
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
            </main>
            <footer className="w-full font-sans text-base bg-neutral-300 text-neutral-600 flex flex-col items-center justify-center p-4">
                <p className="mb-1">Created by <a href="https://graceis.online/" target="_blank" rel="noreferrer" className="underline">Grace Manning</a>.</p>
                <p className="mb-1">Enjoyed it? Send a <a href="https://ko-fi.com/graceisonline" target="_blank" rel="noreferrer" className="underline">thank you</a> :-)</p>
                <img src={globe} alt="cursor icon with speed lines" className="w-5 h-5" />
            </footer>
        </div>
    );
}
