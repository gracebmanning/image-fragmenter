const disabledStyle = { color: "#808080", textShadow: "1px 1px 0 #ffffff" };

const activeStyle = { color: "#262626", textShadow: "none" };

export default function EffectControls({ effects, setters, disabled }) {
    const { seamless, invert, grayscale, sepia, edgeDetect, pixelate, noBg } = effects;
    const { setSeamless, setInvert, setGrayscale, setSepia, setEdgeDetect, setPixelate, setNoBg } = setters;

    return (
        <>
            <div className="flex flex-row justify-center items-center w-[90%]">
                <div className="field-row w-full">
                    <input type="checkbox" id="seamlessLoopCheckbox" checked={seamless} onChange={() => setSeamless(!seamless)} disabled={disabled} />
                    <label htmlFor="seamlessLoopCheckbox" className="text-sm font-medium text-neutral-800">
                        Seamless loop
                    </label>
                </div>
                <div className="field-row w-full">
                    <input type="checkbox" id="invertColorsCheckbox" checked={invert} onChange={() => setInvert(!invert)} disabled={disabled} />
                    <label htmlFor="invertColorsCheckbox" className="text-sm font-medium text-neutral-800">
                        Invert colors
                    </label>
                </div>
            </div>
            <div className="flex flex-row justify-center items-center w-[90%]">
                <div className="field-row w-full">
                    <input type="checkbox" id="grayscaleCheckbox" checked={grayscale} onChange={() => setGrayscale(!grayscale)} disabled={disabled} />
                    <label htmlFor="grayscaleCheckbox" className="text-sm font-medium text-neutral-800">
                        Grayscale
                    </label>
                </div>

                <div className="field-row w-full">
                    <input type="checkbox" id="sepiaCheckbox" checked={sepia} onChange={() => setSepia(!sepia)} disabled={disabled} />
                    <label htmlFor="sepiaCheckbox" className="text-sm font-medium text-neutral-800">
                        Sepia
                    </label>
                </div>
            </div>
            <div className="flex flex-row justify-center items-center w-[90%]">
                <div className="field-row w-full">
                    <input type="checkbox" id="edgeDetectCheckbox" checked={edgeDetect} onChange={() => setEdgeDetect(!edgeDetect)} disabled={disabled} />
                    <label htmlFor="edgeDetectCheckbox" className="text-sm font-medium text-neutral-800">
                        Edge detect
                    </label>
                </div>
                <div className="field-row w-full">
                    <input type="checkbox" id="noBgCheckbox" checked={noBg} onChange={() => setNoBg(!noBg)} disabled={disabled} />
                    <label htmlFor="noBgCheckbox" className="text-sm font-medium text-neutral-800">
                        No background
                    </label>
                </div>
            </div>
            <div className="field-row-stacked w-[90%]">
                <label htmlFor="delaySlider" className="text-sm font-medium" style={disabled ? disabledStyle : activeStyle}>
                    Pixelate: {pixelate}%
                </label>
                <div className="field-row w-full">
                    <label htmlFor="range0" className="text-xs" style={disabled ? disabledStyle : activeStyle}>
                        0%
                    </label>
                    <input id="delaySlider" type="range" min="0" max="100" step="1" value={pixelate} onChange={(e) => setPixelate(Number(e.target.value))} disabled={disabled} />
                    <label htmlFor="range100" className="text-xs" style={disabled ? disabledStyle : activeStyle}>
                        100%
                    </label>
                </div>
            </div>
        </>
    );
}
