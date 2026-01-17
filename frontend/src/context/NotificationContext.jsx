import axios from "axios";
import { toast } from "react-hot-toast";
import { createContext, useContext, useEffect, useState } from "react";
import { SocketData } from "./SocketContext";
import { UserData } from "./UserContext";
import { useNavigate } from "react-router-dom"; // Added this import

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { socket } = SocketData();
    const { user, isAuth } = UserData();
    const navigate = useNavigate(); // Added this line

    const [notifications, setNotifications] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loading, setLoading] = useState(false);

    async function fetchNotifications() {
        setLoading(true);
        try {
            const { data } = await axios.get("/api/notifications/all");
            setNotifications(data);
        } catch (error) {
            console.log(error);
        } finally {
            setLoading(false);
        }
    }

    async function fetchUnreadCount() {
        try {
            const { data } = await axios.get("/api/notifications/unread");
            setUnreadCount(data.count);
        } catch (error) {
            console.log(error);
        }
    }

    useEffect(() => {
        if (isAuth) {
            fetchUnreadCount();
        }
    }, [isAuth]);

    useEffect(() => {
        if (socket) {
            socket.on("notification:new", (newNotification) => {
                setNotifications((prev) => [newNotification, ...prev]);
                setUnreadCount((prev) => prev + 1);
                let toastMessage = "New Notification";
                if (newNotification.type === "real") toastMessage = "thinks your post is Real";
                else if (newNotification.type === "reflect") return; // Silence reflections
                else if (newNotification.type === "comment") toastMessage = "commented on your post";
                else if (newNotification.type === "follow") toastMessage = "started following you";
                else if (newNotification.type === "follow_request") toastMessage = "sent you a follow request";
                else if (newNotification.type === "request_accepted") toastMessage = "accepted your follow request";
                else if (newNotification.type === "comment_reply") toastMessage = "replied on your comment";

                toast.success(`${newNotification.sender?.name || "Someone"} ${toastMessage}`);
            });

            socket.on("notification:update", (updatedNotification) => {
                setNotifications((prev) =>
                    prev.map((n) => (n._id === updatedNotification._id ? updatedNotification : n))
                );
            });

            socket.on("notification:delete", (notificationId) => {
                setNotifications((prev) => prev.filter((n) => n._id !== notificationId));
            });

            return () => {
                socket.off("notification:new");
                socket.off("notification:update");
                socket.off("notification:delete");
            };
        }
    }, [socket]);

    return (
        <NotificationContext.Provider
            value={{
                notifications,
                setNotifications,
                unreadCount,
                setUnreadCount,
                fetchNotifications,
                fetchUnreadCount,
                loading,
            }}
        >
            {children}
        </NotificationContext.Provider>
    );
};

export const NotificationData = () => useContext(NotificationContext);
