import axios from "axios";
import { toast } from "react-hot-toast";
import { createContext, useContext, useEffect, useState } from "react";
import { SocketData } from "./SocketContext";
import { UserData } from "./UserContext";

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
    const { socket } = SocketData();
    const { user, isAuth } = UserData();

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
                toast.success(`${newNotification.sender?.name || "Someone"} ${newNotification.type === "like" ? "liked" : "commented on"} your post`);
            });

            socket.on("notification:update", (updatedNotification) => {
                setNotifications((prev) =>
                    prev.map((n) => n._id === updatedNotification._id ? { ...n, ...updatedNotification } : n)
                );
            });

            return () => {
                socket.off("notification:new");
                socket.off("notification:update");
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
