import React from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";

const ConfirmationModal = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirm Action",
    message = "Are you sure you want to proceed?",
    confirmText = "Delete",
    cancelText = "Cancel",
    type = "danger"
}) => {
    if (!isOpen) return null;

    return createPortal(
        <AnimatePresence>
            <div className="fixed inset-0 z-[100001] flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    onClick={onClose}
                />

                {/* Modal Card */}
                <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    className="relative bg-[var(--card-bg)] border border-[var(--border)] rounded-2xl shadow-2xl w-full max-w-[320px] overflow-hidden z-10"
                >
                    <div className="p-6 flex flex-col items-center text-center">
                        <h3 className="text-[var(--text-primary)] font-bold text-lg mb-2">{title}</h3>
                        <p className="text-[var(--text-secondary)] text-sm mb-6 leading-relaxed">
                            {message}
                        </p>

                        <div className="flex flex-col w-full gap-2">
                            <button
                                onClick={() => {
                                    onConfirm();
                                    onClose();
                                }}
                                className={`w-full py-2.5 rounded-xl font-bold transition-all active:scale-95 ${type === "danger"
                                        ? "bg-[var(--accent-secondary)] text-white hover:opacity-90 shadow-lg shadow-[var(--accent-secondary)]/20"
                                        : "bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90 shadow-lg shadow-[var(--accent)]/20"
                                    }`}
                            >
                                {confirmText}
                            </button>
                            <button
                                onClick={onClose}
                                className="w-full py-2.5 rounded-xl font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-secondary)] transition-all active:scale-95"
                            >
                                {cancelText}
                            </button>
                        </div>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>,
        document.body
    );
};

export default ConfirmationModal;
