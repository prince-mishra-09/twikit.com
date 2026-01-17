import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { BsThreeDotsVertical } from "react-icons/bs";
import StoryAvatar from "./StoryAvatar";
import { format } from "date-fns";
import { UserData } from "../context/UserContext";

const CommentItem = ({ comment, postId, addComment, deleteComment, postOwnerId, activeCommentMenuId, toggleCommentMenu, onReplyAdded, onDelete, activeCommentId, setReplyingTo }) => {
    const { user } = UserData();
    const [showReplies, setShowReplies] = useState(false);

    // Auto-expand if activeCommentId is one of the replies
    useEffect(() => {
        if (!activeCommentId || !comment.replies) return;

        // Convert to string for safe comparison
        const targetId = String(activeCommentId);
        const match = comment.replies.find(r => String(r._id) === targetId);

        console.log("Reply Expand Check:", {
            parentId: comment._id,
            targetId,
            repliesCount: comment.replies.length,
            matchFound: !!match
        });

        if (match) {
            console.log("MATCH FOUND! Expanding replies for parent:", comment._id);
            setShowReplies(true);

            // Scroll to the specific reply after expansion?
            setTimeout(() => {
                const element = document.getElementById(`comment-${targetId}`);
                if (element) {
                    element.scrollIntoView({ behavior: "smooth", block: "center" });
                    element.classList.add("bg-white/10");
                    setTimeout(() => element.classList.remove("bg-white/10"), 2000);
                }
            }, 500); // Wait for expansion animation
        }
    }, [activeCommentId, comment.replies]);

    const isOwner = user?._id === comment.user?._id || user?._id === postOwnerId;

    const getFormattedUsername = (u) => {
        if (!u) return "former_user";
        if (u.username) return u.username;
        return u.name ? u.name.toLowerCase().replace(/\s+/g, '_') : "user";
    };

    const handleReplyClick = () => {
        setReplyingTo({ id: comment._id, user: comment.user });
    };

    const handleDelete = async () => {
        await deleteComment(postId, comment._id);
        onDelete(comment._id);
        // Toggle menu off
        toggleCommentMenu(comment._id);
    };

    const formatCommentDate = (dateString) => {
        if (!dateString) return "just now";
        const date = new Date(dateString);
        const now = new Date();
        const diffInSeconds = Math.floor((now - date) / 1000);

        if (diffInSeconds < 60) return "just now";
        if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
        if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
        if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
        return `${Math.floor(diffInSeconds / 604800)}w`;
    };

    return (
        <div id={`comment-${comment._id}`} className="flex flex-col gap-2 transition-colors duration-500 rounded-lg">
            {/* Main Comment */}
            <div className={`flex gap-3 items-start p-2 rounded-lg hover:bg-white/5 transition-all duration-200 group ${comment.status === "sending" ? "opacity-60 pointer-events-none" : "opacity-100"}`}>
                <Link to={`/user/${comment.user?._id}`} className="shrink-0">
                    <StoryAvatar user={comment.user} size="w-8 h-8" />
                </Link>

                <div className="flex flex-col flex-1">
                    <div className="flex items-baseline justify-between w-full">
                        <div className="flex items-baseline gap-2">
                            <Link to={`/user/${comment.user?._id}`}>
                                <span className="text-sm font-semibold text-white hover:underline">
                                    @{getFormattedUsername(comment.user)}
                                </span>
                            </Link>
                            <span className="text-xs text-gray-400">{formatCommentDate(comment.createdAt)}</span>
                        </div>

                        {isOwner && (
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); toggleCommentMenu(comment._id); }}
                                    className={`text-gray-400 hover:text-white p-1 transition-opacity ${activeCommentMenuId === comment._id ? 'opacity-100' : 'opacity-100'}`}
                                >
                                    <BsThreeDotsVertical className="text-xs" />
                                </button>
                                {/* Delete Modal for this specific comment */}
                                {activeCommentMenuId === comment._id && (
                                    <div className="absolute right-0 top-full mt-1 bg-[#2D3748] p-2 rounded items-center flex gap-2 z-50 shadow-lg border border-white/10 w-32 animate-in fade-in zoom-in-95 duration-100">
                                        <button onClick={handleDelete} className="text-xs text-red-500 font-bold hover:underline">Delete</button>
                                        <button onClick={() => toggleCommentMenu(comment._id)} className="text-xs text-white hover:underline">Cancel</button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    <p className="text-sm text-gray-200 mt-0.5 leading-tight whitespace-pre-wrap">{comment.comment}</p>

                    {/* Actions: Reply Button */}
                    <div className="flex gap-4 mt-1">
                        <button
                            onClick={handleReplyClick}
                            className="text-xs text-gray-400 font-semibold hover:text-white"
                        >
                            Reply
                        </button>
                    </div>
                </div>
            </div>

            {/* View Replies Toggle */}
            {comment.replies && comment.replies.length > 0 && (
                <div className="pl-12">
                    {!showReplies ? (
                        <button onClick={() => setShowReplies(true)} className="flex items-center gap-2 my-1">
                            <div className="w-8 h-[1px] bg-gray-600"></div>
                            <span className="text-xs text-gray-400 font-semibold hover:text-white">View {comment.replies.length} replies</span>
                        </button>
                    ) : (
                        <div className="flex flex-col gap-3 mt-2 border-l-2 border-gray-700 pl-4">
                            <div onClick={() => setShowReplies(false)} className="cursor-pointer text-xs text-gray-500 mb-1 hover:text-white">Hide replies</div>
                            {comment.replies.map((reply) => (
                                <div id={`comment-${reply._id}`} key={reply._id} className={`flex gap-2 items-start transition-all duration-200 rounded-lg p-1 ${reply.status === "sending" ? "opacity-50 pointer-events-none" : "opacity-90 hover:bg-white/5"}`}>
                                    <Link to={`/user/${reply.user?._id}`} className="shrink-0">
                                        <StoryAvatar user={reply.user} size="w-6 h-6" />
                                    </Link>
                                    <div className="flex flex-col flex-1">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-xs font-bold text-white">@{getFormattedUsername(reply.user)}</span>
                                            <span className="text-[10px] text-gray-400">{formatCommentDate(reply.createdAt)}</span>
                                            {/* Simple delete for reply */}
                                            {(user?._id === reply.user?._id || user?._id === postOwnerId) && (
                                                <button
                                                    onClick={async () => {
                                                        if (confirm("Delete reply?")) {
                                                            await deleteComment(postId, reply._id);
                                                            onDelete(reply._id, comment._id);
                                                        }
                                                    }}
                                                    className="text-[10px] text-gray-500 hover:text-red-500 ml-auto"
                                                >
                                                    Delete
                                                </button>
                                            )}
                                        </div>
                                        <p className="text-xs text-gray-300 mt-0.5">{reply.comment}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default CommentItem;
