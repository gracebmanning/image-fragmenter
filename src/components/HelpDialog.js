import { useEffect, useRef } from "react";
import help from "../assets/help_sheet-0.png";

export default function HelpDialog({ isOpen, onClose }) {
    const dialogRef = useRef(null);

    useEffect(() => {
        if (dialogRef.current) {
            if (isOpen) {
                dialogRef.current.showModal();
            } else {
                dialogRef.current.close();
            }
        }
    }, [isOpen]);

    // close with the escape key
    const handleEscape = (event) => {
        if (event.target === dialogRef.current) {
            onClose();
        }
    };

    return (
        <dialog ref={dialogRef} onCancel={handleEscape}>
            <div className="window w-full max-w-lg p-6 md:p-8 space-y-6">
                <div className="title-bar">
                    <div className="title-bar-text text-xl font-bold text-white flex flex-row">
                        <img src={help} alt="piece of cream-colored paper with blue question mark on it" />
                        Help
                    </div>
                    <div className="title-bar-controls">
                        <button aria-label="Close" onClick={onClose} />
                    </div>
                </div>
                <div className="window-body text-sm">
                    <ul className="tree-view">
                        <li>
                            <b>How To Use</b>
                            <ul>
                                <li>1. Upload an image and set a number of frames to generate.</li>
                                <li>
                                    2. Press "Generate Art" and let the magic happen!
                                    <ul>
                                        <li>(An algorithm will randomly select parts of your image to crop & paste onto itself.)</li>
                                    </ul>
                                </li>
                                <li>3. After the frames are generated, a GIF will render.</li>
                                <li>4. Adjust the delay and image effects.</li>
                                <li>5. When you're happy with it, download your artwork!</li>
                            </ul>
                        </li>
                        <li>
                            <b>Download Options</b>
                            <ul>
                                <li>
                                    <u>ZIP</u>: receive a zip folder of all generated frames to use in your own project.
                                </li>
                                <li>
                                    <u>GIF</u>: a gif file of your animation
                                </li>
                                <li>
                                    <u>VIDEO</u>: a video (.mp4) file of your gif animation
                                </li>
                            </ul>
                        </li>
                        <li>
                            <b>Image Effects</b>
                            <ul>
                                <li>
                                    <u>Seamless Loop</u>: The frames will be played twice: once forward, and once reversed, so the gif plays in a perfect loop.
                                </li>
                                <li>
                                    <u>Invert Colors</u>: Pixels are reversed...AKA each color is replaced by its opposite on the color wheel.
                                </li>
                                <li>
                                    <u>Grayscale</u>: Convert image to grayscale.
                                </li>
                                <li>
                                    <u>Sepia</u>: Convert image to sepia tone.
                                </li>
                                <li>
                                    <u>Edge Detect</u>: Detect edges in the image.
                                </li>
                                <li>
                                    <u>Pixelate</u>: Adjust the resolution to make each pixel more or less visible.
                                </li>
                            </ul>
                        </li>
                    </ul>
                </div>
                <div className="status-bar">
                    <p className="status-bar-field text-sm">Press Esc or [x] to close</p>
                </div>
            </div>
        </dialog>
    );
}
