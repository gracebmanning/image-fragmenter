import { useState } from "react";

export function useImageEffects() {
    const [seamless, setSeamless] = useState(false);
    const [invert, setInvert] = useState(false);
    const [grayscale, setGrayscale] = useState(false);
    const [sepia, setSepia] = useState(false);
    const [edgeDetect, setEdgeDetect] = useState(false);
    const [pixelate, setPixelate] = useState(0);
    const [noBg, setNoBg] = useState(false);

    const effectOptions = {
        seamless,
        invert,
        grayscale,
        sepia,
        edgeDetect,
        pixelate,
        noBg,
    };

    const resetEffects = () => {
        setSeamless(false);
        setInvert(false);
        setGrayscale(false);
        setSepia(false);
        setEdgeDetect(false);
        setPixelate(0);
        setNoBg(false);
    };

    return {
        effects: effectOptions,
        setSeamless,
        setInvert,
        setGrayscale,
        setSepia,
        setEdgeDetect,
        setPixelate,
        setNoBg,
        resetEffects,
    };
}
