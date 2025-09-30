export default function InitialControls({ frameCount, setFrameCount, disabled, backgroundState }) {
    const { noBg, setNoBg } = backgroundState;
    return (
        <div className="w-full mt-4">
            <div className="field-row mb-4">
                <label htmlFor="frameCount" className="text-sm font-medium text-neutral-800">
                    Frames
                </label>
                <input className="text-neutral-700 text-xs" id="frameCount" type="number" value={frameCount} onChange={(e) => setFrameCount(Number(e.target.value))} disabled={disabled} />
            </div>
            <div className="field-row w-full">
                <input type="checkbox" id="noBgCheckbox" checked={noBg} onChange={() => setNoBg(!noBg)} disabled={disabled} />
                <label htmlFor="noBgCheckbox" className="text-sm font-medium text-neutral-800">
                    Transparent background
                </label>
            </div>
        </div>
    );
}
