import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { UserData } from "./UserContext";

const EndPoint = import.meta.env.MODE === "development" ? "http://localhost:5000" : "https://twikit-backend.onrender.com";

const SocketContext = createContext();

export const SocketContextProvider = ({ children }) => {
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const { user } = UserData();

  useEffect(() => {
    if (!user?._id) return;

    const socket = io(EndPoint, {
      query: { userId: user._id },
      withCredentials: true,
    });

    setSocket(socket);

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
