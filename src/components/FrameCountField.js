export default function FrameCountField({ frameCount, setFrameCount, disabled }) {
    return (
        <div className="field-row mt-4">
            <label htmlFor="frameCount" className="text-sm font-medium text-neutral-800">
                Frames
            </label>
            <input id="frameCount" type="number" value={frameCount} onChange={(e) => setFrameCount(Number(e.target.value))} className="text-neutral-700 text-xs" disabled={disabled} />
        </div>
    );
}
