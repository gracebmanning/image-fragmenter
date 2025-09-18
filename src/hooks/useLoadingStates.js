import { useState } from "react";

export function useLoadingStates() {
    const [status, setStatus] = useState("Select an image to start.");
    const [isProcessing, setIsProcessing] = useState(false);
    const [isDownloading, setIsDownloading] = useState(null); // 'zip','video', 'gif', null
    const [gifProgress, setGifProgress] = useState(0);
    const [videoProgress, setVideoProgress] = useState(0);
    const [isRenderingGif, setIsRenderingGif] = useState(false);

    const states = {
        status,
        isProcessing,
        isDownloading,
        gifProgress,
        videoProgress,
        isRenderingGif,
    };

    const resetStates = () => {
        setStatus("");
        setIsProcessing(false);
        setIsDownloading(null);
        setGifProgress(0);
        setVideoProgress(0);
        setIsRenderingGif(false);
    };

    return {
        loadingStates: states,
        setStatus,
        setIsProcessing,
        setIsDownloading,
        setGifProgress,
        setVideoProgress,
        setIsRenderingGif,
        resetStates,
    };
}
