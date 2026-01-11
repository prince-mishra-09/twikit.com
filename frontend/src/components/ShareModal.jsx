import React, { useEffect, useState } from "react";
import { FaSearch, FaTimes, FaPaperPlane } from "react-icons/fa";
import { ChatData } from "../context/ChatContext";
import { UserData } from "../context/UserContext";
import axios from "axios";
import toast from "react-hot-toast";

const ShareModal = ({ isOpen, onClose, content }) => {
    const { chats } = ChatData(); // Uses recent chats
    const { user: myUser } = UserData();
    const [query, setQuery] = useState("");
    const [users, setUsers] = useState([]); // Search results
    const [selectedUsers, setSelectedUsers] = useState([]);
    const [message, setMessage] = useState("");
    const [loading, setLoading] = useState(false);

    // SEARCH LOGIC
    useEffect(() => {
        if (!query.trim()) {
            setUsers([]);
            return;
        }
        const timer = setTimeout(async () => {
            try {
                const { data } = await axios.get("/api/user/all?search=" + query);
                setUsers(data.users || []);
            } catch (error) {
                console.log(error);
            }
        }, 500);
        return () => clearTimeout(timer);
    }, [query]);

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
            const promises = selectedUsers.map(user =>
                axios.post("/api/messages", {
                    recieverId: user._id,
                    message: message,
                    sharedContent: content,
                })
            );

            await Promise.all(promises);

            toast.success(`Sent to ${selectedUsers.length} users!`);
            onClose();
            setMessage("");
            setSelectedUsers([]);
        } catch (error) {
            toast.error(error.response?.data?.message || "Failed to send");
            console.log(error);
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-[#111827] w-full max-w-md rounded-2xl border border-white/10 overflow-hidden shadow-2xl flex flex-col max-h-[80vh]">

                {/* HEADER */}
                <div className="flex items-center justify-between p-4 border-b border-white/10">
                    <h3 className="text-white font-semibold">Share</h3>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">
                        <FaTimes />
                    </button>
                </div>

                {/* SEARCH & PREVIEW */}
                <div className="p-4 space-y-4 flex-none">
                    {/* Content Preview */}
                    <div className="bg-[#1F2937]/50 p-3 rounded-xl flex items-center gap-3 border border-white/5">
                        {content.preview.image && (
                            <img src={content.preview.image} alt="" className="w-10 h-10 rounded-lg object-cover" />
                        )}
                        <div className="flex-1 min-w-0">
                            <p className="text-white text-sm font-medium truncate">{content.preview.title || "Content"}</p>
                            <p className="text-gray-400 text-xs">@{content.preview.username}</p>
                        </div>
                    </div>

                    {/* Search Input */}
                    <div className="relative">
                        <FaSearch className="absolute left-3 top-3 text-gray-500" />
                        <input
                            type="text"
                            placeholder="Search user..."
                            className="w-full bg-[#0B0F14] text-white rounded-xl pl-9 pr-4 py-2.5 border border-white/10 focus:border-indigo-500 outline-none placeholder-gray-500"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* LIST - GRID LAYOUT */}
                <div className="flex-1 overflow-y-auto px-4 pb-2">
                    <div className="grid grid-cols-4 gap-4">
                        {query ? (
                            users.length > 0 ? users.map(u => (
                                <UserItem
                                    key={u._id}
                                    user={u}
                                    selected={selectedUsers.some(sel => sel._id === u._id)}
                                    onSelect={() => toggleUser(u)}
                                />
                            )) : <p className="col-span-4 text-center text-gray-500 text-sm py-4">No users found</p>
                        ) : (
                            <>
                                {chats.map(chat => {
                                    // Get other user
                                    const other = chat.users.find(u => u._id !== myUser?._id) || chat.users[0];
                                    return (
                                        <UserItem
                                            key={chat._id}
                                            user={other}
                                            selected={selectedUsers.some(sel => sel._id === other._id)}
                                            onSelect={() => toggleUser(other)}
                                        />
                                    );
                                })}
                            </>
                        )}
                    </div>
                    {!query && chats.length === 0 && <p className="text-center text-gray-500 text-sm py-4">No recent chats</p>}
                </div>

                {/* FOOTER - SEND */}
                {selectedUsers.length > 0 && (
                    <div className="p-4 border-t border-white/10 bg-[#1F2937]/30 backdrop-blur-md">
                        <div className="flex flex-col gap-3">
                            {/* Selected Avatars (Optional: small indicators) */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
                                {selectedUsers.map(u => (
                                    <div key={u._id} className="relative shrink-0">
                                        <img src={u.profilePic?.url} className="w-8 h-8 rounded-full border border-white/20" alt="" />
                                        <button
                                            onClick={() => toggleUser(u)}
                                            className="absolute -top-1 -right-1 bg-gray-800 text-white rounded-full w-4 h-4 flex items-center justify-center text-[10px] border border-white/20"
                                        >
                                            ✕
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Write a message..."
                                    className="flex-1 bg-[#0B0F14] text-white px-4 py-2 rounded-xl border border-white/10 outline-none"
                                    value={message}
                                    onChange={e => setMessage(e.target.value)}
                                />
                                <button
                                    onClick={handleSend}
                                    disabled={loading}
                                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 rounded-xl font-medium transition-colors flex items-center justify-center disabled:opacity-50 whitespace-nowrap"
                                >
                                    {loading ? "..." : `Send (${selectedUsers.length})`}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

const UserItem = ({ user, selected, onSelect }) => (
    <div
        onClick={onSelect}
        className={`flex flex-col items-center gap-2 p-2 rounded-xl cursor-pointer transition-all active:scale-95 group relative`}
    >
        {/* Avatar Ring */}
        <div className={`p-1 rounded-full border-2 transition-colors ${selected ? "border-indigo-500" : "border-transparent group-hover:border-white/20"}`}>
            <div className="relative">
                <img src={user.profilePic?.url || "/default-avatar.png"} alt="" className="w-14 h-14 rounded-full object-cover aspect-square shrink-0" />
                {selected && (
                    <div className="absolute bottom-0 right-0 bg-indigo-500 w-5 h-5 rounded-full border-2 border-[#111827] flex items-center justify-center">
                        <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                        </svg>
                    </div>
                )}
            </div>
        </div>

        {/* Username */}
        <p className="text-xs text-gray-300 truncate max-w-full text-center">
            {user.username || user.name.split(' ')[0]}
        </p>
    </div>
);

export default ShareModal;
