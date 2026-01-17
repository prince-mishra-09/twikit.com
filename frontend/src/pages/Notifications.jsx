import React, { useEffect } from "react";
import { NotificationData } from "../context/NotificationContext";
import { IoNotificationsOutline } from "react-icons/io5";
import { Link, useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa6";
import { format } from "date-fns";
import axios from "axios";
import { SkeletonUserList } from "../components/Skeleton";
import toast from "react-hot-toast";

const Notifications = () => {
    const navigate = useNavigate();
    const { notifications, setNotifications, fetchNotifications, loading, setUnreadCount } =
        NotificationData();

    useEffect(() => {
        fetchNotifications();
        markAsRead();
    }, []);

    async function markAsRead() {
        try {
            await axios.put("/api/notifications/read");
            setUnreadCount(0);
        } catch (error) {
            console.log(error);
        }
    }

    const acceptRequest = async (id, notificationId) => {
        try {
            await axios.post(`/api/user/accept-request/${id}`);
            setNotifications(prev => prev.map(n =>
                n._id === notificationId ? { ...n, type: "request_accepted", actionRequired: false } : n
            ));
            toast.success("Request Accepted");
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    };

    const rejectRequest = async (id, notificationId) => {
        try {
            await axios.post(`/api/user/reject-request/${id}`);
            setNotifications(prev => prev.filter(n => n._id !== notificationId));
            toast.success("Request Rejected");
        } catch (error) {
            toast.error(error.response?.data?.message || "Something went wrong");
        }
    };

    const getPostLink = (n) => {
        if (!n.postId) return "#";

        // REEL CHECK: 
        // We know type is populated now (from previous fix)
        // Check n.postId.type OR if it lacks type but looks like a reel? 
        // We rely on type being populated. 
        if (n.postId.type === 'reel') {
            return `/reels?id=${n.postId._id || n.postId}`;
        }

        let url = `/post/${n.postId._id || n.postId}`;
        const params = new URLSearchParams();

        if (n.relatedComment) {
            const commentId = n.relatedComment._id || n.relatedComment;
            params.append("commentId", String(commentId));
        } else if (n.type === "comment" || n.type === "comment_reply") {
            params.append("openComments", "true");
        }

        const queryString = params.toString();
        return queryString ? `${url}?${queryString}` : url;
    };

    const getNotificationMessage = (type) => {
        switch (type) {
            case "real":
                return "thinks your post is Real";
            case "reflect":
                return "sent a reflection on your post";
            case "comment":
                return "commented on your post";
            case "follow":
                return "started following you";
            case "follow_request":
                return "sent you a follow request";
            case "request_accepted":
                return "accepted your follow request";
            case "comment_reply":
                return "replied on your comment";
            case "message":
                return "sent you a new message";
            default:
                return "interacted with you";
        }
    };


    return (
        <div className="min-h-screen bg-[#0B0F14] flex justify-center text-white">
            <div className="w-full max-w-xl px-4 py-6 pb-24">
                <div className="flex items-center gap-3 mb-6">
                    <button
                        onClick={() => navigate("/")}
                        className="text-white p-2 rounded-full hover:bg-white/10 -ml-2"
                    >
                        <FaArrowLeft />
                    </button>
                    <h1 className="text-xl font-bold flex items-center gap-2">
                        <IoNotificationsOutline /> Notifications
                    </h1>
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <SkeletonUserList />
                    ) : notifications && notifications.length > 0 ? (
                        notifications.map((n) => (
                            <div
                                key={n._id}
                                className={`relative flex items-center gap-4 p-4 rounded-2xl border ${!n.isRead
                                    ? "bg-[#111827] border-indigo-500/30 shadow-[0_0_10px_rgba(99,102,241,0.1)]"
                                    : "bg-[#111827]/40 border-white/5 opacity-80"
                                    } transition-all duration-300 hover:opacity-100 cursor-pointer`}
                                onClick={() => navigate(getPostLink(n))}
                            >
                                <Link to={`/user/${n.sender._id}`} className="shrink-0">
                                    <img
                                        src={n.sender?.profilePic?.url || "https://cdn-icons-png.flaticon.com/512/1077/1077114.png"}
                                        alt=""
                                        className="w-10 h-10 rounded-full object-cover border border-white/10"
                                    />
                                </Link>

                                <div className="flex-1">
                                    <p className="text-sm">
                                        <Link to={`/user/${n.sender._id}`} className="font-semibold text-gray-200 hover:underline" onClick={(e) => e.stopPropagation()}>
                                            @{n.sender.username}
                                        </Link>{" "}
                                        <Link to={getPostLink(n)} className="text-gray-400 hover:text-gray-300" onClick={(e) => e.stopPropagation()}>
                                            {getNotificationMessage(n.type)}
                                        </Link>
                                    </p>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {format(new Date(n.createdAt), "MMM do, h:mm a")}
                                    </p>

                                    {n.type === "follow_request" && n.actionRequired && (
                                        <div className="flex gap-3 mt-3">
                                            <button
                                                onClick={() => acceptRequest(n.sender._id, n._id)}
                                                className="bg-indigo-600 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-indigo-500 transition-colors"
                                            >
                                                Accept
                                            </button>
                                            <button
                                                onClick={() => rejectRequest(n.sender._id, n._id)}
                                                className="bg-gray-700 text-white px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-gray-600 transition-colors"
                                            >
                                                Reject
                                            </button>
                                        </div>
                                    )}
                                </div>

                                {n.postId && (
                                    <Link to={getPostLink(n)}>
                                        {n.postId?.post?.url ? (
                                            n.postId.type === 'reel' ? (
                                                <video src={n.postId.post.url} className="w-10 h-10 rounded-lg object-cover border border-white/10" muted playsInline loop autoPlay />
                                            ) : (
                                                <img
                                                    src={n.postId.post.url}
                                                    alt="post"
                                                    className="w-10 h-10 rounded-lg object-cover border border-white/10"
                                                />
                                            )
                                        ) : (
                                            <div className="w-10 h-10 rounded-lg bg-gray-800" />
                                        )}
                                    </Link>
                                )}
                            </div>
                        ))
                    ) : (
                        <div className="text-center py-20">
                            <div className="bg-[#111827] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                                <IoNotificationsOutline className="text-2xl text-gray-500" />
                            </div>
                            <p className="text-gray-400">No notifications yet</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Notifications;
