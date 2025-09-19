import "./index.css";
import "98.css";
import "./98-custom.css";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
    <BrowserRouter>
        <AppRoutes />
    </BrowserRouter>
);
