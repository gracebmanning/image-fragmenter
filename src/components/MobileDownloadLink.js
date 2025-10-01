import { useEffect } from "react";

export default function MobileDownloadLink({ linkInfo, setter }) {
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
    console.log(mediaName);

    const clearMobileDownloadLink = () => {
        setter(null);
    };

    return (
        <div className="w-full mt-2 p-2 bg-neutral-400 border-neutral-500 border-2 border-solid rounded-md text-center relative">
            <button className="min-w-fit w-fit absolute top-1 right-2 px-2 text-xs bg-transparent border-none cursor-pointer text-neutral-800" onClick={clearMobileDownloadLink}>
                x
            </button>
            <a className="text-sm underline" href={url} target="_blank" rel="noopener noreferrer">
                Tap here to open your {mediaName}.
            </a>
            <p className="text-xs text-neutral-900 m-0 mt-1">Then, use the Share icon to Save it to your device.</p>
        </div>
    );
}
