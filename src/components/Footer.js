import { Link } from "react-router-dom";
import globe from "../assets/internet_connection_wiz-0.png";

export default function Footer() {
    return (
        <footer className="w-full font-sans text-base bg-neutral-300 text-neutral-600 flex flex-col items-center justify-center p-2">
            <p className="mb-1">
                Created by{" "}
                <a href="https://graceis.online/" target="_blank" rel="noreferrer" className="underline">
                    Grace Manning
                </a>
                .
            </p>
            <p className="mb-1">
                Enjoyed it? Send a{" "}
                <a href="https://ko-fi.com/graceisonline" target="_blank" rel="noreferrer" className="underline">
                    thank you
                </a>
                !
            </p>
            <div className="w-full flex flex-row justify-center items-center text-sm mb-2">
                *
                <Link to="/privacy" className="underline mx-2">
                    Privacy
                </Link>
                *
                <Link to="/support" className="underline mx-2">
                    Support
                </Link>
                *
            </div>
            <img src={globe} alt="earth globe with mouse pointer" className="w-6 h-6" />
        </footer>
    );
}
