import Footer from "../components/Footer";

export default function Layout({ body }) {
    return (
        <div className="w-full min-h-screen flex flex-col items-center justify-center">
            {body}
            <Footer />
        </div>
    );
}
