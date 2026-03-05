import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { UserData } from "./UserContext";

const EndPoint = import.meta.env.MODE === "development"
  ? `http://${window.location.hostname}:5000`
  : import.meta.env.VITE_API_URL;

const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = UserData();

  useEffect(() => {
    if (!user?._id) return;

    // Retrieve token from cookies if possible to ensure it's sent
    const getCookie = (name) => {
      const value = `; ${document.cookie}`;
      const parts = value.split(`; ${name}=`);
      if (parts.length === 2) return parts.pop().split(';').shift();
      return null;
    };
    const token = getCookie("token");

    const socket = io(EndPoint, {
      query: { userId: user._id },
      auth: { token }, // explicitly pass the token since cross-port local IPs drop cookies
      withCredentials: true,
      transports: ["websocket", "polling"], // Allow polling fallback if websocket is blocked
    });

    setSocket(socket);

    socket.on("connect", () => {
      console.log(`[FRONTEND SOCKET] Connected with ID: ${socket.id} for user: ${user._id}`);
    });

    // Initial online users list
    socket.on("getOnlineUser", setOnlineUsers);

    // Handle individual user coming online
    socket.on("userOnline", (userId) => {
      setOnlineUsers((prev) => {
        if (prev.includes(userId)) return prev;
        return [...prev, userId];
      });
    });

    // Handle individual user going offline
    socket.on("userOffline", (userId) => {
      setOnlineUsers((prev) => prev.filter((id) => id !== userId));
    });

    return () => socket.close();
  }, [user?._id]);



  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const SocketData = () => useContext(SocketContext);
