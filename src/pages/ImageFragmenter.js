import { useState, useEffect,useRef } from 'react';
import { TbUpload, TbBolt, TbDownload } from "react-icons/tb";
import JSZip from 'jszip';
import GIF from 'gif.js';

export default function ImageFragmenter() {
    const [originalImage, setOriginalImage] = useState(null);
    const [imagePreview, setImagePreview] = useState('');
    const [generatedFrames, setGeneratedFrames] = useState([]);
    const [frameCount, setFrameCount] = useState(40);
    const [frameDuration, setFrameDuration] = useState(200);
    const [status, setStatus] = useState('Select an image to start.');
    const [isProcessing, setIsProcessing] = useState(false);
    const fileInputRef = useRef(null);

    useEffect(() => {
        const loadScript = (src, id) => {
            if (document.getElementById(id)) return;
            const script = document.createElement('script');
            script.src = src;
            script.id = id;
            script.async = true;
            document.body.appendChild(script);
        };
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/jszip/3.10.1/jszip.min.js", "jszip-script");
        loadScript("https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.js", "gif-script");
    }, []);

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
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    };

    const generateFrames = async () => {
        if (!originalImage) return;

        setIsProcessing(true);
        setStatus('⚙️ Generating frames...');
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
            setStatus(`⚙️ Generating frame ${i + 1} of ${frameCount}...`);
        }
        
        setGeneratedFrames(frames);
        setStatus(`✅ ${frames.length} frames generated! Choose a download format.`);
        setIsProcessing(false);
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
        setStatus('📦 Creating ZIP file...');
        const zip = new JSZip();
        generatedFrames.forEach((blob, i) => {
            zip.file(`frame_${String(i).padStart(4, '0')}.jpg`, blob);
        });
        const zipBlob = await zip.generateAsync({ type: 'blob' });
        triggerDownload(zipBlob, 'glitch-images.zip');
        setStatus('ZIP download started!');
    };

    const downloadGif = () => {
        if (typeof GIF === 'undefined') {
            alert('gif.js library not loaded yet. Please wait.');
            return;
        }
        setStatus('🎨 Creating GIF...');
        const gif = new GIF({
            workers: 2,
            quality: 10,
            width: originalImage.width,
            height: originalImage.height,
            workerScript: '/js/gif.worker.js',
        });

        const imageLoadPromises = generatedFrames.map(blob => {
            return new Promise(resolve => {
                const img = new Image();
                img.onload = () => resolve(img);
                img.src = URL.createObjectURL(blob);
            });
        });

        Promise.all(imageLoadPromises).then(imageElements => {
            imageElements.forEach(img => {
                gif.addFrame(img, { delay: frameDuration });
                URL.revokeObjectURL(img.src);
            });
            gif.on('finished', (blob) => {
                triggerDownload(blob, 'animation.gif');
                setStatus('GIF download started!');
            });
            gif.render();
        });
    };

    const downloadVideo = async () => {
        setStatus('🎬 Creating video...');
        const canvas = document.createElement('canvas');
        canvas.width = originalImage.width;
        canvas.height = originalImage.height;
        const ctx = canvas.getContext('2d');
        const stream = canvas.captureStream();
        const recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        
        const chunks = [];
        recorder.ondataavailable = (e) => chunks.push(e.data);
        recorder.onstop = () => {
            const blob = new Blob(chunks, { type: 'video/webm' });
            triggerDownload(blob, 'animation.webm');
            setStatus('Video download started!');
        };

        recorder.start();
        for (const frameBlob of generatedFrames) {
            const bmp = await createImageBitmap(frameBlob);
            ctx.drawImage(bmp, 0, 0);
            await new Promise(resolve => setTimeout(resolve, frameDuration));
        }
        recorder.stop();
    };


    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center">
            <main className="w-full bg-slate-900 text-slate-200 flex flex-col flex-grow items-center justify-center p-4">
                <div className="w-full max-w-md bg-slate-800 rounded-2xl shadow-2xl p-6 md:p-8 space-y-6">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold text-white">Image Fragmenter</h1>
                        <p className="text-slate-400 mt-2">glitch your pics!!</p>
                    </div>

                    <input
                        type="file"
                        accept="image/*"
                        ref={fileInputRef}
                        onChange={handleFileSelect}
                        className="hidden"
                    />

                    {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="w-full h-auto rounded-lg border-2 border-slate-700" />
                    ) : (
                        <button
                            onClick={() => fileInputRef.current.click()}
                            className="w-full flex flex-col items-center justify-center border-2 border-dashed border-slate-600 rounded-lg p-12 text-slate-400 hover:bg-slate-700 hover:border-slate-500 transition-colors"
                        >
                            <TbUpload className="w-10 h-10 mb-2" />
                            <span>Click to Upload Image</span>
                        </button>
                    )}

                    {originalImage && (
                        <>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="frameCount" className="block text-sm font-medium text-slate-300 mb-1">Frames</label>
                                    <input id="frameCount" type="number" value={frameCount} onChange={(e) => setFrameCount(Number(e.target.value))} className="w-full bg-slate-700 text-white rounded-md border-slate-600 p-2 focus:ring-2 focus:ring-slate-500" />
                                </div>
                                <div>
                                    <label htmlFor="frameDuration" className="block text-sm font-medium text-slate-300 mb-1">Duration (ms)</label>
                                    <input id="frameDuration" type="number" value={frameDuration} onChange={(e) => setFrameDuration(Number(e.target.value))} className="w-full bg-slate-700 text-white rounded-md border-slate-600 p-2 focus:ring-2 focus:ring-slate-500" />
                                </div>
                            </div>

                            <button
                                onClick={generateFrames}
                                disabled={isProcessing}
                                className="w-full flex items-center justify-center bg-lime-800 text-white font-bold py-3 px-4 rounded-lg hover:bg-lime-900 disabled:bg-slate-600 disabled:cursor-not-allowed transition-colors"
                            >
                                {isProcessing && <TbBolt className="w-5 h-5 mr-2 animate-pulse" />}
                                {isProcessing ? 'Generating...' : 'Generate Art'}
                            </button>
                        </>
                    )}

                    <div className="text-center text-base text-slate-400 h-5">{status}</div>
                    
                    {generatedFrames.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-4 border-t border-slate-700">
                            <button onClick={downloadZip} className="flex items-center justify-center bg-lime-900 hover:bg-lime-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                <TbDownload className="w-5 h-5 mr-2" /> ZIP
                            </button>
                            <button onClick={downloadGif} className="flex items-center justify-center bg-lime-900 hover:bg-lime-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                <TbDownload className="w-5 h-5 mr-2" /> GIF
                            </button>
                            <button onClick={downloadVideo} className="flex items-center justify-center bg-lime-900 hover:bg-lime-800 text-white font-semibold py-2 px-4 rounded-lg transition-colors">
                                <TbDownload className="w-5 h-5 mr-2" /> Video
                            </button>
                        </div>
                    )}
                </div>
            </main>
            <footer className="w-full bg-slate-800 text-slate-200 flex flex-col items-center justify-center p-5 pb-16 md:pb-6">
                <p>Created by <a href="https://graceis.online/" target="_blank" rel="noreferrer" className="underline">Grace Manning</a>.</p>
            </footer>
        </div>
    );
}
