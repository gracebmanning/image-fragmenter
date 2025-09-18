import Layout from "../layouts/layout";
export default function Privacy() {
    const body = (
        <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
            <div className="window w-full max-w-md p-6 md:p-8 space-y-6">
                <div className="title-bar">
                    <div className="title-bar-text text-xl font-bold text-white">Privacy Policy</div>
                </div>
                <div className="window-body">
                    <p className="text-base font-bold">1. Data Collection and Usage</p>
                    <p className="text-sm ml-4 mt-2">
                        *<u>User-uploaded Images:</u> The "Image Fragmenter" tool is designed to process images directly in your browser. When you upload an image, it is{" "}
                        <b>never sent to any servers or stored in any way</b>. All fragmentation and effect generation happen locally on your device.
                    </p>
                    <p className="text-sm ml-4 mt-2">
                        *<u>No Personal Data:</u> We do not collect, store, or have access to any personal information about you, including your name, email, or IP address.
                    </p>
                    <p className="text-base font-bold mt-4">2. Data Security</p>
                    <p className="text-sm ml-4 mt-2">
                        *Because all image processing is done client-side (in your browser), your images are not at risk of being intercepted or stored by our service. Your data remains private and
                        secure on your device.
                    </p>
                    <p className="text-base font-bold mt-4">3. Site Analytics</p>
                    <p className="text-sm ml-4 mt-2">*This site uses Netlify Analytics, a privacy-friendly service, to understand how our website is used.</p>
                    <p className="text-sm ml-4 mt-2">
                        *Netlify Analytics does <b>not</b> use cookies, and it does <b>not</b> track any personal information about you. It works by analyzing server logs, which contain general,
                        anonymized data such as the pages visited and the geographic location of the request (e.g., country or city), but never specific user identities.
                    </p>
                    <p className="text-sm ml-4 mt-2 mb-4">*This data helps us improve the website's performance and understand which features are most popular.</p>
                </div>
            </div>
        </main>
    );
    return <Layout body={body} />;
}
