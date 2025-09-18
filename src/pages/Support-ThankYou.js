import { Link } from "react-router-dom";
import Layout from "../layouts/layout";
import { IoArrowBackOutline } from "react-icons/io5";

export default function SupportThankYou() {
    const body = (
        <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
            <div className="window w-full max-w-md p-6 md:p-8 space-y-6">
                <div className="title-bar">
                    <div className="title-bar-text text-xl font-bold text-white">Submission Received</div>
                </div>
                <div className="window-body text-sm">
                    <p>We have received your response. Thank you!</p>
                </div>
                <div class="status-bar">
                    <Link to="/support" className="status-bar-field flex flex-row justify-start items-center text-sm">
                        <IoArrowBackOutline />
                        back
                    </Link>
                </div>
            </div>
        </main>
    );
    return <Layout body={body} />;
}
