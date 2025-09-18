import Layout from "../layouts/layout";
import { useState } from "react";

const shortInputStyle = {
    padding: "14px 10px",
    marginRight: "5px",
};

const textAreaStyle = {
    padding: "14px 10px",
    marginRight: "5px",
};

export default function Support() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "Report a Problem", // default value
        otherSubject: "",
        message: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDropdownChange = (e) => {
        const newSubject = e.target.value;
        setFormData({
            ...formData,
            subject: newSubject,
            // clear the otherSubject text if the selection is not "Other"
            otherSubject: newSubject === "Other" ? formData.otherSubject : "",
        });
    };

    const body = (
        <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
            <div className="window w-full max-w-md p-6 md:p-8 space-y-6">
                <div className="title-bar">
                    <div className="title-bar-text text-xl font-bold text-white">Support Form</div>
                </div>
                <div className="window-body">
                    <form className="w-full max-w-md flex flex-col justify-center items-start text-base" name="support" method="POST" data-netlify="true">
                        {/* Hidden input for Netlify to detect the form */}
                        <input type="hidden" name="form-name" value="support" />
                        <div className="w-full mb-4 flex flex-col justify-center items-start">
                            <label className="text-sm" htmlFor="name">
                                Your Name:
                            </label>
                            <input
                                style={shortInputStyle}
                                className="w-[80%] md:w-[60%] text-sm h-5"
                                type="text"
                                name="name"
                                id="name"
                                autoComplete="off"
                                onChange={handleChange}
                                value={formData.name}
                            />
                        </div>
                        <div className="w-full my-4 flex flex-col justify-center items-start">
                            <label className="text-sm" htmlFor="email">
                                Your Email:
                            </label>
                            <input
                                style={shortInputStyle}
                                className="w-[80%] md:w-[60%] text-sm h-fit"
                                type="email"
                                name="email"
                                id="email"
                                autoComplete="on"
                                onChange={handleChange}
                                value={formData.email}
                            />
                        </div>
                        <div className="w-full my-4 flex flex-col justify-center items-start">
                            <label className="text-sm" htmlFor="subject">
                                Subject:
                            </label>
                            <div className="w-full md:w-[80%] flex flex-col sm:flex-row sm:justify-start justify-center sm:items-center items-start">
                                <select className="text-sm h-fit w-[70%] sm:w-[50%]" id="subject" name="subject" onChange={handleDropdownChange} value={formData.subject} required>
                                    <option value="General Feedback" className="text-sm h-5">
                                        General Feedback
                                    </option>
                                    <option value="Help/Question" className="text-sm h-5">
                                        Help/Question
                                    </option>
                                    <option value="Request a Feature" className="text-sm h-5">
                                        Request a Feature
                                    </option>
                                    <option value="Report a Problem" className="text-sm h-5">
                                        Report a Problem
                                    </option>
                                    <option value="Other" className="text-sm h-5">
                                        Other
                                    </option>
                                </select>

                                {formData.subject === "Other" && (
                                    <input
                                        style={shortInputStyle}
                                        className="text-sm h-fit mt-2 sm:mt-0 sm:ml-2 w-[70%] sm:w-[50%]"
                                        type="text"
                                        name="otherSubject"
                                        placeholder="Please specify"
                                        onChange={handleChange}
                                        value={formData.otherSubject}
                                        required
                                    ></input>
                                )}
                            </div>
                        </div>
                        <div className="w-full my-4 flex flex-col justify-center items-start">
                            <label className="text-sm">Message:</label>
                            <textarea style={textAreaStyle} className="w-full md:w-[80%] text-sm" name="message" onChange={handleChange} value={formData.message} required></textarea>
                        </div>
                        <div className="my-4">
                            <button className="text-sm" type="submit">
                                Send
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </main>
    );
    return <Layout body={body} />;
}
