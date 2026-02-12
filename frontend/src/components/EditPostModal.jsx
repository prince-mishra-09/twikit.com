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
            <motion.div
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="fixed inset-0 z-[100005] bg-[var(--bg-primary)] flex flex-col"
            >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
                    <div className="flex items-center gap-3">
                        <button onClick={onClose} className="text-2xl text-[var(--text-primary)]">
                            <IoChevronBack />
                        </button>
                        <h2 className="text-lg font-bold text-[var(--text-primary)]">Edit Post</h2>
                    </div>
                    <button
                        onClick={handleUpdate}
                        disabled={loading}
                        className="text-[var(--accent)] font-bold text-sm hover:opacity-80 disabled:opacity-50 transition-all"
                    >
                        {loading ? "Updating..." : "Post"}
                    </button>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-[var(--bg-primary)]">
                    {/* Post Preview (Image/Video) */}
                    <div className="w-full aspect-[3/4] bg-black">
                        {post?.type === "reel" ? (
                            <video
                                src={post?.post?.url}
                                className="w-full h-full object-cover"
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
                    <div className="p-4">
                        <label className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider mb-2 block">
                            Caption
                        </label>
                        <textarea
                            value={caption}
                            onChange={(e) => setCaption(e.target.value)}
                            className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] p-4 rounded-2xl border border-[var(--border)] focus:border-[var(--accent)] outline-none text-base resize-none min-h-[120px]"
                            placeholder="Write a caption..."
                            autoFocus
                        />
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>,
        document.body
    );
};

export default EditPostModal;
