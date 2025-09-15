import "./index.css";
import "98.css";
import "./98-custom.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import ImageFragmenter from "./pages/ImageFragmenter";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import NotFound from "./pages/404";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <BrowserRouter>
        <Routes>
            <Route path="*" element={<NotFound />} />
            <Route path="/" element={<ImageFragmenter />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/support" element={<Support />} />
        </Routes>
    </BrowserRouter>
);
