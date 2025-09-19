import { Routes, Route } from "react-router-dom";
import ImageFragmenter from "./pages/ImageFragmenter";
import Privacy from "./pages/Privacy";
import Support from "./pages/Support";
import SupportThankYou from "./pages/Support-ThankYou";
import NotFound from "./pages/404";

const AppRoutes = () => (
    <Routes>
        <Route path="*" element={<NotFound />} />
        <Route path="/" element={<ImageFragmenter />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/support" element={<Support />} />
        <Route path="/support/thank-you" element={<SupportThankYou />} />
    </Routes>
);

export default AppRoutes;