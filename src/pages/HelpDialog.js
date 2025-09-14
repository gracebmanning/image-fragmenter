import '98.css';
import { useEffect, useRef } from 'react';
import help from '../assets/help_sheet-0.png';

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
                    <p>Adjust the delay using the slider.</p>
                    <br/>
                    <p>When you're happy with it, download as a GIF or a Video!</p>
                    <br/>
                    <p>If you want the individual image files, download them as a ZIP.</p>
                </div>
            </div>
        </dialog>
    )
}