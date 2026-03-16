import React, { useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { IoClose, IoChevronBack } from "react-icons/io5";

const EditPostModal = ({ isOpen, onClose, post, onUpdate }) => {
    const [caption, setCaption] = useState(post?.caption || "");
    const [loading, setLoading] = useState(false);

    if (!isOpen) return null;

    const handleUpdate = async () => {
        setLoading(true);
        await onUpdate(post?._id, caption);
        setLoading(false);
        onClose();
    };

    return createPortal(
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-[100005] flex items-center justify-center">
                    {/* Backdrop */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="absolute inset-0 bg-[var(--overlay)] backdrop-blur-sm"
                        onClick={onClose}
                    />

                    {/* Modal Container */}
                    <motion.div
                        initial={{ y: "100%", opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: "100%", opacity: 0 }}
                        transition={{ type: "spring", damping: 30, stiffness: 300 }}
                        className="relative w-full h-full md:h-auto md:max-h-[90vh] md:max-w-md bg-[var(--bg-primary)] flex flex-col shadow-2xl md:rounded-[2.5rem] overflow-hidden"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                            <div className="flex items-center gap-3">
                                <button onClick={onClose} className="text-2xl text-[var(--text-primary)] hover:opacity-70 transition-opacity">
                                    <IoChevronBack />
                                </button>
                                <h2 className="text-lg font-bold text-[var(--text-primary)]">Edit Post</h2>
                            </div>
                            <button
                                onClick={handleUpdate}
                                disabled={loading}
                                className="text-[var(--accent)] font-bold text-sm hover:opacity-80 disabled:opacity-50 transition-all bg-[var(--accent)]/10 px-4 py-1.5 rounded-full"
                            >
                                {loading ? "Updating..." : "Update"}
                            </button>
                        </div>

                        {/* Content Area */}
                        <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)]">
                            {/* Post Preview (Image/Video) */}
                            <div className="w-full aspect-[3/4] bg-black flex items-center justify-center">
                                {post?.type === "reel" ? (
                                    <video
                                        src={post?.post?.url}
                                        className="w-full h-full object-contain"
                                        controls
                                    />
                                ) : (
                                    <img
                                        src={post?.post?.url}
                                        alt="Post Preview"
                                        className="w-full h-full object-cover"
                                    />
                                )}
                            </div>

                            {/* Caption Edit Area */}
                            <div className="p-6">
                                <label className="text-[10px] font-bold text-[var(--text-secondary)] uppercase tracking-[0.2em] mb-3 block opacity-60">
                                    Caption
                                </label>
                                <textarea
                                    value={caption}
                                    onChange={(e) => setCaption(e.target.value)}
                                    className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-5 rounded-3xl border border-[var(--border)] focus:border-[var(--accent)] outline-none text-base resize-none min-h-[140px] transition-all"
                                    placeholder="Write a caption..."
                                    autoFocus
                                />
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>,
        document.body
    );
};

export default EditPostModal;
