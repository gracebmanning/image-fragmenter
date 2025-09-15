import "98.css";
import { TbDownload } from "react-icons/tb";

export default function DownloadPanel({ downloadFunctions, allBusy }) {
    const { downloadZip, downloadGif, downloadVideo } = downloadFunctions;
    return (
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
    );
}
