import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { IoSparklesOutline } from "react-icons/io5";

const PWAUpdateModal = ({ show, onUpdate, onLater }) => {
    return (
        <AnimatePresence>
            {show && (
                <div className="fixed inset-0 z-[2000] flex items-end justify-center p-4 sm:p-6 pointer-events-none">
                    {/* Overlay for depth (not blocking clicks behind if needed, but here we block specifically for the modal) */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 bg-black/40 backdrop-blur-[2px] pointer-events-auto"
                        onClick={onLater}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        className="relative w-full max-w-md bg-[var(--bg-primary)]/70 backdrop-blur-xl border border-white/20 rounded-[2rem] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] overflow-hidden pointer-events-auto"
                    >
                        {/* Neon Accent Line */}
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-[var(--accent)] to-transparent opacity-50" />

                        <div className="flex flex-col items-center text-center gap-4">
                            {/* Icon / Visual */}
                            <div className="w-16 h-16 bg-[var(--accent)]/10 rounded-2xl flex items-center justify-center relative group">
                                <div className="absolute inset-0 bg-[var(--accent)]/20 blur-xl rounded-full animate-pulse" />
                                <IoSparklesOutline className="text-3xl text-[var(--accent)] relative z-10 group-hover:rotate-12 transition-transform duration-300" />
                            </div>

                            {/* Text Content */}
                            <div className="space-y-2">
                                <h3 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
                                    New Vibe Detected! 🚀
                                </h3>
                                <p className="text-[var(--text-secondary)] text-sm leading-relaxed max-w-[80%] mx-auto">
                                    We just pushed some fresh features to make your experience smoother. Ready for the update?
                                </p>
                            </div>

                            {/* Actions */}
                            <div className="flex flex-col w-full gap-3 mt-2">
                                <button
                                    onClick={onUpdate}
                                    className="w-full py-4 bg-[var(--accent)] hover:bg-[var(--accent)]/90 text-white font-bold rounded-2xl shadow-[0_0_20px_rgba(99,102,241,0.4)] transition-all active:scale-[0.98]"
                                >
                                    Update Now
                                </button>
                                <button
                                    onClick={onLater}
                                    className="w-full py-3 bg-transparent text-[var(--text-secondary)] font-medium hover:text-[var(--text-primary)] transition-colors text-sm"
                                >
                                    Maybe Later
                                </button>
                            </div>
                        </div>

                        {/* Subtle Design Element */}
                        <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-[var(--accent)]/5 blur-3xl rounded-full" />
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default PWAUpdateModal;
