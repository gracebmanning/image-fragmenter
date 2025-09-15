import construction from "../assets/construction.gif";

export default function ProgressBar({ type, gifProgress, videoProgress }) {
    let progress = null;
    if (type === "gif") {
        progress = gifProgress;
    } else {
        progress = (gifProgress + videoProgress) / 2;
    }
    return (
        <div className="w-full mt-4 mb-4 flex flex-col justify-evenly items-center">
            <img src={construction} alt="construction man" className="w-20 h-auto mr-1" />
            {type === "video" ? <p className="text-sm animate-pulse">Video download can take some time...</p> : null}
            <div className="progress-indicator segmented w-full mt-4 h-2.5 my-2">
                <span className="progress-indicator-bar" style={{ width: `${progress}%` }} />
            </div>
        </div>
    );
}
