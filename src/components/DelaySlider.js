export default function DelaySlider({ gifDelay, setGifDelay, disabled }) {
    return (
        <div className="field-row-stacked w-[90%]">
            <label htmlFor="delaySlider" className="text-sm font-medium" style={disabled ? { color: "#808080", textShadow: "1px 1px 0 #ffffff" } : { color: "text-neutral-800" }}>
                Delay: {gifDelay}ms
            </label>
            <div className="field-row w-full">
                <label htmlFor="range0" className="text-xs" style={disabled ? { color: "#808080", textShadow: "1px 1px 0 #ffffff" } : { color: "text-neutral-800" }}>
                    10ms
                </label>
                <input id="delaySlider" type="range" min="10" max="1000" step="10" value={gifDelay} onChange={(e) => setGifDelay(Number(e.target.value))} disabled={disabled} />
                <label htmlFor="range100" className="text-xs" style={disabled ? { color: "#808080", textShadow: "1px 1px 0 #ffffff" } : { color: "text-neutral-800" }}>
                    1000ms
                </label>
            </div>
        </div>
    );
}
