import { useEffect } from "react";

export default function MobileDownloadLink({ linkInfo, onClear }) {
    const { url, fileType } = linkInfo || {};

    // clean up the URL when the component is re-rendered.
    useEffect(() => {
        return () => {
            if (url) {
                URL.revokeObjectURL(url);
            }
        };
    }, [url]);

    if (!linkInfo) return null;

    const mediaName = fileType === "image/gif" ? "GIF" : "Video";

    return (
        <div>
            <button onClick={onClear}>huh?</button>
            <a href={url} target="_blank" rel="noopener noreferrer">
                Tap here to open your {mediaName}.
            </a>
            <p className="text-sm m-0 mt-1">Then, use the Share icon to Save it to your device.</p>
        </div>
    );
}
