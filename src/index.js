import "./index.css";
import "98.css";
import "./98-custom.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ImageFragmenter from "./pages/ImageFragmenter";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<ImageFragmenter />} />
        </Routes>
    </BrowserRouter>
);
