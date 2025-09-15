import Layout from "../layouts/layout";
import { useState } from "react";

export default function Support() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        subject: "",
        message: "",
    });

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleDropdownChange = (e) => {
        var otherInput = document.getElementById("otherInput");
        if (e.target.value === "other") {
            otherInput.style.display = "block";
            //otherInput.setAttribute("required", "required");
        } else {
            otherInput.style.display = "none";
            otherInput.removeAttribute("required");
            otherInput.value = "";
        }
    };

    const body = (
        <main className="w-full bg-neutral-400 flex flex-col flex-grow items-center justify-center p-4">
            <form className="w-full flex flex-col justify-center items-start text-base" name="support" method="POST" data-netlify="true">
                {/* Hidden input for Netlify to detect the form */}
                <input type="hidden" name="form-name" value="support" />
                <p>
                    <label htmlFor="name">Your Name:</label>
                    <input type="text" name="name" id="name" autoComplete="off" className="short-input" onChange={handleChange} value={formData.name} />
                </p>
                <p>
                    <label htmlFor="email">Your Email:</label>
                    <input type="email" name="email" id="email" autoComplete="on" className="short-input" onChange={handleChange} value={formData.email} />
                </p>
                <p>
                    <label htmlFor="subject">Subject:</label>
                    <select id="subject" name="subject" onChange={handleDropdownChange} value={formData.subject} required>
                        <option value="option1">Feature Request</option>
                        <option value="option2">Report a Problem</option>
                        <option value="other">Other</option>
                    </select>

                    <input
                        type="text"
                        id="otherInput"
                        name="otherInput"
                        className="short-input"
                        style={{ display: "none" }}
                        placeholder="Please specify"
                        onChange={handleChange}
                        value={formData.subject}
                    ></input>
                </p>
                <p>
                    <label>
                        Message: <textarea name="message" className="long-input" onChange={handleChange} value={formData.message} required></textarea>
                    </label>
                </p>
                <p>
                    <button type="submit">Send</button>
                </p>
            </form>
        </main>
    );
    return <Layout body={body} />;
}
