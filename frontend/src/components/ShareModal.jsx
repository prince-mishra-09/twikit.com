import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaSearch, FaTimes, FaPaperPlane } from "react-icons/fa";
import { ChatData } from "../context/ChatContext";
import { UserData } from "../context/UserContext";
import axios from "axios";
import toast from "react-hot-toast";

const ShareModal = ({ isOpen, onClose, content, onShare }) => {
    const { chats, setChats } = ChatData(); // Uses recent chats
    const { user: myUser } = UserData();
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]); // Search results
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // SEARCH LOGIC
    useEffect(() => {
        // If query is empty but we have restriction, we still fetch "suggestions"
        const isRestricted = content?.owner?.isPrivate && content.owner._id;

        if (!query.trim() && !isRestricted) {
            setUsers([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                let searchUrl = `/api/user/all?search=${query}`;
                if (content?.owner?.isPrivate && content.owner._id) {
                    searchUrl += `&restrictToFollowersOf=${content.owner._id}`;
                }
                const { data } = await axios.get(searchUrl);
                setUsers(data.users || []);
            } catch (error) {
                // console.log(error);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query, content]);

    const toggleUser = (user) => {
        setSelectedUsers(prev => {
            const exists = prev.find(u => u._id === user._id);
            if (exists) return prev.filter(u => u._id !== user._id);
            return [...prev, user];
        });
    };

    const handleSend = async () => {
        if (selectedUsers.length === 0) return;
        setLoading(true);
        try {
            // Send to all selected users
            // console.log("Sending shared content:", content);
            // console.log("Recipients:", selectedUsers);

            const promises = selectedUsers.map(user =>
                axios.post("/api/messages", {
                    recieverId: user._id,
                    message: message,
                    sharedContent: content,
                })
            );

            const responses = await Promise.all(promises);
            // console.log("Share responses:", responses);

            // UPDATE LOCAL CHATS STATE FOR SORTING
            setChats(prev => {
                const updatedChats = [...prev];
                selectedUsers.forEach(selUser => {
                    const chatIndex = updatedChats.findIndex(c => c.users.some(u => u._id === selUser._id));
                    if (chatIndex !== -1) {
                        updatedChats[chatIndex] = {
                            ...updatedChats[chatIndex],
                            latestMessage: {
                                text: message || (content.type === "reel" ? "Shared reel" : content.type === "post" ? "Shared post" : "Shared profile"),
                                sender: myUser._id,
                            },
                            updatedAt: new Date().toISOString(),
                        };
                    }
                });
                return updatedChats;
            });

            toast.success(`Sent to ${selectedUsers.length} users!`);
            if (onShare) onShare(selectedUsers.length);
            onClose();
            setMessage("");
            setSelectedUsers([]);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send");
            // console.log(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[var(--card-bg)] w-full max-w-md rounded-2xl border border-[var(--border)] overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">

                {/* HEADER */}
                <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
                    <h3 className="text-[var(--text-primary)] font-semibold">Share</h3>
                    <button onClick={onClose} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">
                        <FaTimes />
                    </button>
                </div>

                {/* SEARCH & PREVIEW */}
                <div className="p-4 space-y-4 flex-none">
                    {/* Content Preview */}
                    <div className="bg-[var(--bg-secondary)]/50 p-3 rounded-xl flex items-center gap-3 border border-[var(--border)]/50">
                        {content.type === "reel" ? (
                            <video src={content.preview.image} className="w-10 h-10 rounded-lg object-cover bg-black" muted />
                        ) : (
                            content.preview.image && <img src={content.preview.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-[var(--text-primary)] text-sm font-medium truncate">{content.preview.title || "Content"}</p>
                            <p className="text-[var(--text-secondary)] text-xs">@{content.preview.username}</p>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-[var(--text-secondary)]" />
                        <input
                            type="text"
                            placeholder="Search user..."
                            className="w-full bg-[var(--bg-primary)] text-[var(--text-primary)] rounded-xl pl-9 pr-4 py-2.5 border border-[var(--border)] focus:border-[var(--accent)] outline-none placeholder-[var(--text-secondary)]/50"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                    {/* Restriction Hint */}
                    {content?.owner?.isPrivate && (
                        <p className="px-1 mt-1.5 text-[10px] text-yellow-500/80 flex items-center gap-1">
                            <span className="w-1 h-1 rounded-full bg-yellow-500"></span>
                            Searching only followers of {content.owner.username || "private account"}
                        </p>
                    )}
                </div>

                {/* LIST - GRID LAYOUT */}
                <div className="flex-1 overflow-y-auto px-4 pb-2">
                    <div className="grid grid-cols-4 gap-4">
                        {query || (content?.owner?.isPrivate && content.owner._id) ? (
                            users.length > 0 ? users.map(u => (
                                <UserItem
                                    key={u._id}
                                    user={u}
                                    selected={selectedUsers.some(sel => sel._id === u._id)}
                                    onSelect={() => toggleUser(u)}
                                    isRestricted={u.isPrivate && u._id !== myUser?._id && !myUser?.followings?.some(f => (f._id || f) === u._id)}
                                />
                            )) : <p className="col-span-4 text-center text-[var(--text-secondary)] text-sm py-4">No users found</p>
                        ) : (
                            <>
                                {chats.map(chat => {
                                    // Get other user
                                    const other = chat.users.find(u => u._id !== myUser?._id) || chat.users[0];
                                    if (!other) return null;
                                    const restricted = other.isPrivate && other._id !== myUser?._id && !myUser?.followings?.some(f => (f._id || f) === other._id);

                                    return (
                                        <UserItem
                                            key={chat._id}
                                            user={other}
                                            selected={selectedUsers.some(sel => sel._id === other._id)}
                                            onSelect={() => toggleUser(other)}
                                            isRestricted={restricted}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </div>
                    {!query && chats.length === 0 && <p className="text-center text-[var(--text-secondary)] text-sm py-4">No recent chats</p>}
                </div>

                {/* FOOTER - SEND */}
                {selectedUsers.length > 0 && (
                    <div className="p-4 border-t border-[var(--border)] bg-[var(--bg-secondary)]/30 backdrop-blur-md">
                        <div className="flex flex-col gap-3">
                            {/* Selected Avatars (Optional: small indicators) */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {selectedUsers.map(u => (
                                    <div key={u._id} className="relative shrink-0">
                                        <img src={u.profilePic?.url} className="w-8 h-8 rounded-full border border-[var(--border)] aspect-square object-cover" alt="" />
                                        <button
                                            onClick={() => toggleUser(u)}
                                            className="absolute -top-1 -right-1 bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-full w-4 h-4 flex items-center justify-center text-[10px] border border-[var(--border)]"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2 w-full">
                                <input
                                    type="text"
                                    placeholder="Message..."
                                    className="flex-1 min-w-0 bg-[var(--bg-primary)] text-[var(--text-primary)] px-3 py-2 rounded-xl border border-[var(--border)] outline-none text-sm"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading}
                                    className="bg-[var(--accent)] hover:opacity-90 text-[var(--text-on-accent)] px-4 rounded-xl font-bold transition-colors flex items-center justify-center disabled:opacity-50 whitespace-nowrap shrink-0 text-sm"
                                >
                                    {loading ? "..." : `Send${selectedUsers.length > 0 ? ` (${selectedUsers.length})` : ""}`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>,
        document.body
    );
};

const UserItem = ({ user, selected, onSelect, isRestricted }) => (
    <div
        onClick={isRestricted ? () => toast.error("Bhai, ye private account hai. Follow kiye bina share nahi kar sakte!") : onSelect}
        className={`flex flex-col items-center gap-2 p-2 rounded-xl cursor-pointer transition-all active:scale-95 group relative ${isRestricted ? "opacity-30 grayscale saturate-0" : ""}`}
    >
        {/* Avatar Ring */}
        <div className={`p-1 rounded-full border-2 transition-colors ${selected ? "border-[var(--accent)]" : "border-transparent group-hover:border-[var(--border)]"}`}>
            <div className="relative aspect-square w-14 h-14">
                <img src={user.profilePic?.url || "/default-avatar.png"} alt="" className="w-full h-full rounded-full object-cover aspect-square shrink-0" />
                {selected && (
                    <div className="absolute bottom-0 right-0 bg-[var(--accent)] w-5 h-5 rounded-full border-2 border-[var(--card-bg)] flex items-center justify-center">
                        <svg className="w-3 h-3 text-[var(--text-on-accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
                {isRestricted && (
                    <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-white/60" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M12 17a2 2 0 01-2-2V9a2 2 0 012-2m0 10a2 2 0 002-2V9a2 2 0 00-2-2m0 10v4m0-14V3m0 0a9 9 0 110 18 9 9 0 010-18z" />
                        </svg>
                    </div>
                )}
            </div>
        </div>

        {/* Username */}
        <p className={`text-xs ${isRestricted ? "text-[var(--text-secondary)]/50" : "text-[var(--text-secondary)] group-hover:text-[var(--text-primary)]"} truncate max-w-full text-center transition-colors`}>
            {user.username || user.name.split(' ')[0]}
        </p>
    </div>
);

export default ShareModal;
