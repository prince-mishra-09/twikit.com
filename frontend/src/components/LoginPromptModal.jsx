import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { UserData } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import { IoClose } from "react-icons/io5";

const LoginPromptModal = () => {
    const { showLoginPrompt, setShowLoginPrompt } = UserData();
    const navigate = useNavigate();

    if (!showLoginPrompt) return null;

    const handleAction = (path) => {
        setShowLoginPrompt(false);
        navigate(path);
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-[200000] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={() => setShowLoginPrompt(false)}
                />

                {/* Modal */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="relative w-full max-w-sm bg-[#1F2937] rounded-3xl p-8 shadow-2xl border border-white/10 text-center"
                    onClick={(e) => e.stopPropagation()}
                >
                    <button
                        onClick={() => setShowLoginPrompt(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
                    >
                        <IoClose size={24} />
                    </button>

                    <div className="mb-6">
                        <img src="/images/xwaked-white.png" alt="xwaked" className="w-10 h-auto" />
                        <h2 className="text-2xl font-bold text-white mb-2">Join xwaked</h2>
                        <p className="text-gray-400 text-sm">
                            Capture your moments and connect with the community. Login or signup to interact!
                        </p>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button
                            onClick={() => handleAction("/login")}
                            className="w-full py-4 bg-indigo-600 hover:bg-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-600/20 active:scale-95"
                        >
                            Log In
                        </button>
                        <button
                            onClick={() => handleAction("/register")}
                            className="w-full py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl transition-all border border-white/10 active:scale-95"
                        >
                            Sign Up
                        </button>
                        <button
                            onClick={() => setShowLoginPrompt(false)}
                            className="w-full py-2 text-gray-500 text-sm font-medium hover:text-gray-300 transition-colors"
                        >
                            Maybe Later
                        </button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
};

export default LoginPromptModal;
