import '98.css';
import globe from "../assets/internet_connection_wiz-0.png";

export default function Footer(){
    return(
        <footer className="w-full font-sans text-base bg-neutral-300 text-neutral-600 flex flex-col items-center justify-center p-4">
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
        <img src={globe} alt="earth globe with mouse pointer" className="w-5 h-5" />
      </footer>
    )
}