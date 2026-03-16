import React, { useState } from "react";
import { FaTools, FaUserShield, FaLock, FaEnvelope } from "react-icons/fa";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

const Maintenance = () => {
    const [showLogin, setShowLogin] = useState(false);
    const [identifier, setIdentifier] = useState("");
    const [password, setPassword] = useState("");
    const { loginUser } = UserData();
    const { fetchPosts } = PostData();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleAdminLogin = async (e) => {
        e.preventDefault();

        if (identifier !== "admin@prince") {
            toast.error("Permission Denied: Only Admin can bypass maintenance.");
            return;
        }

        setLoading(true);
        try {
            await loginUser(identifier, password, navigate, fetchPosts);
            window.location.reload(); // Force reload to trigger App.jsx bypass
        } catch (error) {
            console.error("Login failed:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-950 text-white p-4 font-sans">
            <div className="bg-[var(--card-bg)] p-8 rounded-3xl shadow-[0_0_50px_var(--accent-glow)] text-center max-w-md w-full border border-[var(--border)] backdrop-blur-sm relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 via-pink-500 to-purple-500"></div>

                {!showLogin ? (
                    <>
                        <div className="flex justify-center mb-6">
                            <div className="p-5 bg-[var(--accent)]/10 rounded-2xl animate-pulse ring-1 ring-[var(--accent)]/30">
                                <FaTools className="text-5xl text-[var(--accent)]" />
                            </div>
                        </div>

                        <h1 className="text-4xl font-black mb-4 bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-500">
                            Under Maintenance
                        </h1>

                        <p className="text-[var(--text-secondary)] mb-8 text-lg leading-relaxed">
                            We're currently polishing the experience. xwaked will be back and better than ever in a bit!
                        </p>

                        <div className="w-full bg-gray-800 rounded-full h-1.5 mb-8 overflow-hidden">
                            <div className="bg-gradient-to-r from-purple-500 to-pink-500 h-full rounded-full w-2/3 shadow-[0_0_10px_rgba(168,85,247,0.5)] animate-[loading_3s_ease-in-out_infinite]"></div>
                        </div>

                        <button
                            onClick={() => setShowLogin(true)}
                            className="text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors text-sm font-medium flex items-center justify-center gap-2 w-full pt-4 border-t border-[var(--border)]"
                        >
                            <FaUserShield size={14} />
                            Admin Access
                        </button>
                    </>
                ) : (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex justify-center mb-6">
                            <div className="p-4 bg-[var(--accent)]/20 rounded-xl">
                                <FaUserShield className="text-4xl text-[var(--accent)]" />
                            </div>
                        </div>

                        <h2 className="text-2xl font-bold mb-6">Admin Login</h2>

                        <form onSubmit={handleAdminLogin} className="space-y-4">
                            <div className="relative">
                                <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-secondary)]" />
                                <input
                                    type="text"
                                    placeholder="Admin ID"
                                    value={identifier}
                                    onChange={(e) => setIdentifier(e.target.value)}
                                    required
                                    className="w-full bg-[var(--bg-primary)] border-none rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] transition-all outline-none"
                                />
                            </div>
                            <div className="relative">
                                <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                                <input
                                    type="password"
                                    placeholder="Password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    className="w-full bg-[var(--bg-primary)] border-none rounded-xl py-3 pl-12 pr-4 text-[var(--text-primary)] focus:ring-2 focus:ring-[var(--accent)] transition-all outline-none"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white font-bold py-3 rounded-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all disabled:opacity-50 active:scale-[0.98]"
                            >
                                {loading ? "Verifying..." : "Enter Portal"}
                            </button>
                        </form>

                        <button
                            onClick={() => setShowLogin(false)}
                            className="mt-6 text-gray-500 hover:text-gray-300 transition-colors text-sm"
                        >
                            Back to Maintenance
                        </button>
                    </div>
                )}
            </div>

            <style>{`
                @keyframes loading {
                    0% { width: 5%; transform: translateX(-10%); }
                    50% { width: 40%; transform: translateX(120%); }
                    100% { width: 5%; transform: translateX(300%); }
                }
            `}</style>
        </div>
    );
};

export default Maintenance;
