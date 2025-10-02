import { useEffect } from "react";

export default function MobileDownloadLink({ linkInfo }) {
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

    const mediaName = fileType === "image/gif" ? "GIF" : "video";

    return (
        <div className="w-full mt-2 p-2 bg-neutral-400 border-neutral-500 border-2 border-solid rounded-md text-center relative">
            <a className="text-sm underline" href={url} target="_blank" rel="noopener noreferrer">
                Tap here to open your {mediaName}.
            </a>
            <p className="text-xs text-neutral-900 m-0 mt-1">Then, share or save it to your device.</p>
        </div>
    );
}
