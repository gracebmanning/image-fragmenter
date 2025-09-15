import Layout from "../layouts/layout";
export default function Privacy() {
    const body = (
        <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
            <div className="window w-full max-w-md p-6 md:p-8 space-y-6">
                <div className="title-bar">
                    <div className="title-bar-text text-xl font-bold text-white">Privacy Policy</div>
                </div>
                <div className="window-body text-sm">
                    <p>Privacy Policy under construction...</p>
                </div>
            </div>
        </main>
    );
    return <Layout body={body} />;
}
