import React, { useState } from "react";
import { IoClose, IoBug, IoCheckmarkCircle, IoWarning } from "react-icons/io5";
import axios from "axios";
import toast from "react-hot-toast";
import { useLocation } from "react-router-dom";

const CATEGORIES = ["Login", "Feed", "AuraX", "Media", "Others"];

const getDeviceInfo = () => {
    const ua = navigator.userAgent;

    // Device type
    const isMobile = /Mobi|Android|iPhone|iPad/i.test(ua);
    const isTablet = /iPad|Tablet/i.test(ua) || (isMobile && window.innerWidth >= 768);
    const deviceType = isTablet ? "tablet" : isMobile ? "mobile" : "desktop";

    // OS
    let os = "Unknown";
    if (/Windows/i.test(ua)) os = "Windows";
    else if (/Android/i.test(ua)) os = `Android`;
    else if (/iPhone|iPad/.test(ua)) os = "iOS";
    else if (/Mac OS X/i.test(ua)) os = "macOS";
    else if (/Linux/i.test(ua)) os = "Linux";

    // Browser
    let browser = "Unknown";
    if (/Edg\//i.test(ua)) browser = `Edge`;
    else if (/OPR\//i.test(ua) || /Opera/i.test(ua)) browser = `Opera`;
    else if (/Chrome\//i.test(ua)) {
        const v = ua.match(/Chrome\/([\d]+)/)?.[1];
        browser = `Chrome ${v || ""}`.trim();
    } else if (/Firefox\//i.test(ua)) {
        const v = ua.match(/Firefox\/([\d]+)/)?.[1];
        browser = `Firefox ${v || ""}`.trim();
    } else if (/Safari\//i.test(ua)) browser = `Safari`;

    return { deviceType, os, browser };
};

const BugReportModal = ({ onClose }) => {
    const [category, setCategory] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [ticketId, setTicketId] = useState("");
    const location = useLocation();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!category) return toast.error("Please select a category.");
        if (!description.trim() || description.trim().length < 10)
            return toast.error("Description must be at least 10 characters.");

        setLoading(true);
        try {
            const deviceInfo = getDeviceInfo();
            const res = await axios.post(
                `${import.meta.env.VITE_API_URL}/api/bugs/report`,
                {
                    category,
                    description: description.trim(),
                    metadata: {
                        ...deviceInfo,
                        urlLocation: location.pathname,
                    },
                },
                { withCredentials: true }
            );

            setTicketId(res.data.ticketId);
            setSubmitted(true);
        } catch (err) {
            const msg = err?.response?.data?.message || "Something went wrong. Please try again.";
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
            style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(8px)" }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-full max-w-md rounded-2xl overflow-hidden"
                style={{
                    background: "linear-gradient(145deg, #1a1a1a 0%, #111111 100%)",
                    border: "1px solid rgba(255,107,0,0.3)",
                    boxShadow: "0 0 60px rgba(255,107,0,0.15), 0 25px 50px rgba(0,0,0,0.5)",
                }}
            >
                {/* Top gradient bar */}
                <div
                    className="h-1 w-full"
                    style={{ background: "linear-gradient(90deg, #ff8a00, #ff4d00)" }}
                />

                {/* Header */}
                <div className="flex items-center gap-3 px-6 pt-5 pb-4">
                    <div
                        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{
                            background: "linear-gradient(135deg, #ff8a00, #ff4d00)",
                            boxShadow: "0 4px 15px rgba(255,107,0,0.4)",
                        }}
                    >
                        <IoBug className="text-xl text-white" />
                    </div>
                    <div>
                        <h2 className="text-white font-bold text-lg leading-tight">Report a Bug</h2>
                        <p className="text-gray-400 text-xs">Help us make xwaked better 🚀</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="ml-auto p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/10 transition-all"
                    >
                        <IoClose className="text-xl" />
                    </button>
                </div>

                {/* Body */}
                <div className="px-6 pb-6">
                    {submitted ? (
                        /* Success State */
                        <div className="flex flex-col items-center text-center gap-4 py-6">
                            <div
                                className="w-16 h-16 rounded-2xl flex items-center justify-center"
                                style={{ background: "linear-gradient(135deg, #00c851, #007e33)" }}
                            >
                                <IoCheckmarkCircle className="text-3xl text-white" />
                            </div>
                            <div>
                                <h3 className="text-white font-bold text-lg">Got it! ✨</h3>
                                <p className="text-gray-300 text-sm mt-1">
                                    Ticket{" "}
                                    <span
                                        className="font-bold px-2 py-0.5 rounded-md"
                                        style={{ background: "rgba(255,107,0,0.2)", color: "#ff8a00" }}
                                    >
                                        #{ticketId}
                                    </span>{" "}
                                    receive ho gaya hai.
                                </p>
                                <p className="text-gray-500 text-xs mt-2">
                                    Notification dekho — jab fix ho jayega, hum batayenge!
                                </p>
                            </div>
                            <button
                                onClick={onClose}
                                className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white transition-all hover:opacity-80"
                                style={{ background: "linear-gradient(135deg, #ff8a00, #ff4d00)" }}
                            >
                                Done
                            </button>
                        </div>
                    ) : (
                        /* Form State */
                        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                            {/* Category */}
                            <div>
                                <label className="text-gray-300 text-sm font-medium mb-2 block">
                                    Category <span className="text-orange-500">*</span>
                                </label>
                                <div className="flex flex-wrap gap-2">
                                    {CATEGORIES.map((cat) => (
                                        <button
                                            key={cat}
                                            type="button"
                                            onClick={() => setCategory(cat)}
                                            className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all"
                                            style={{
                                                background: category === cat
                                                    ? "linear-gradient(135deg, #ff8a00, #ff4d00)"
                                                    : "rgba(255,255,255,0.06)",
                                                color: category === cat ? "#fff" : "#9ca3af",
                                                border: category === cat
                                                    ? "1px solid transparent"
                                                    : "1px solid rgba(255,255,255,0.1)",
                                                boxShadow: category === cat ? "0 2px 12px rgba(255,107,0,0.35)" : "none",
                                            }}
                                        >
                                            {cat}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            {/* Description */}
                            <div>
                                <label className="text-gray-300 text-sm font-medium mb-2 flex justify-between">
                                    <span>Description <span className="text-orange-500">*</span></span>
                                    <span className="text-gray-500 text-xs">{description.length}/500</span>
                                </label>
                                <textarea
                                    value={description}
                                    onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                                    rows={4}
                                    placeholder="Kya hua? Steps to reproduce, screenshots ka description... sab likho 🐞"
                                    className="w-full text-sm text-white placeholder-gray-600 rounded-xl px-4 py-3 resize-none outline-none transition-all"
                                    style={{
                                        background: "rgba(255,255,255,0.05)",
                                        border: "1px solid rgba(255,255,255,0.1)",
                                        focusRing: "none",
                                    }}
                                    onFocus={(e) => (e.target.style.borderColor = "rgba(255,107,0,0.5)")}
                                    onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.1)")}
                                />
                            </div>

                            {/* Auto-meta note */}
                            <p className="text-gray-600 text-xs flex items-center gap-1.5">
                                <IoWarning className="text-gray-500 flex-shrink-0" />
                                Device info &amp; current page automatically attach honge debugging ke liye.
                            </p>

                            {/* Submit */}
                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-3 rounded-xl text-white font-semibold text-sm transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed mt-1"
                                style={{
                                    background: "linear-gradient(135deg, #ff8a00, #ff4d00)",
                                    boxShadow: "0 4px 20px rgba(255,107,0,0.35)",
                                }}
                            >
                                {loading ? "Submitting..." : "Submit Bug Report 🚀"}
                            </button>
                        </form>
                    )}
                </div>
            </div>
        </div>
    );
};

export default BugReportModal;
