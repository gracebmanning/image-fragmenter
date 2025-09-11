import '98.css';
import { useEffect, useRef } from 'react';
import help from '../assets/help_sheet-0.png';
import gif10ms from '../assets/gif-examples/animation_10ms.gif';
import gif100ms from '../assets/gif-examples/animation_100ms.gif';
import gif250ms from '../assets/gif-examples/animation_250ms.gif';
import gif500ms from '../assets/gif-examples/animation_500ms.gif';
import gif750ms from '../assets/gif-examples/animation_750ms.gif';
import gif1000ms from '../assets/gif-examples/animation_1000ms.gif';

function GifExample({ gif, frames, delay }){
    return(
        <div className="flex flex-col justify-start align-center m-2 md:m-4">
            <img src={gif} alt="gif of flowers with fragmented frames" />
            <p>Frames: {frames}, Delay: {delay}ms</p>
        </div>
    )
}

export default function HelpDialog({ isOpen, onClose }){
    const dialogRef = useRef(null);

    useEffect(() => {
        if(dialogRef.current){
            if(isOpen){
                dialogRef.current.showModal()
            }
            else{
                dialogRef.current.close();
            }
        }
    }, [isOpen]);

    // close with the escape key
    const handleEscape = (event) => {
        if(event.target === dialogRef.current){
            onClose();
        }
    }

    return(
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
                    <p>Upload an image and set a number of frames to generate.</p>
                    <br/>
                    <p>After the frames are generated, a GIF will render. The default delay between frames is 100ms (0.1s).</p>
                    <br/>
                    <p>You may adjust the delay and re-render the preview to see what it will look like.</p>
                    <br/>
                    <p>If you don't want to spend time re-rendering several times, see references below for examples.</p>
                    <div className="grid grid-cols-2 md:grid-cols-3">
                        <GifExample gif={gif10ms} frames={40} delay={10} />
                        <GifExample gif={gif100ms} frames={40} delay={100} />
                        <GifExample gif={gif250ms} frames={40} delay={250} />
                        <GifExample gif={gif500ms} frames={40} delay={500} />
                        <GifExample gif={gif750ms} frames={40} delay={750} />
                        <GifExample gif={gif1000ms} frames={40} delay={1000} />
                    </div>
                </div>
            </div>
        </dialog>
    )
}