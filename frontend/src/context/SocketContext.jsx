import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { UserData } from "./UserContext";

const EndPoint = "https://twikit-backend.onrender.com";

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

  socket.on("getOnlineUser", setOnlineUsers);

  return () => socket.close();
}, [user?._id]);



  return (
    <SocketContext.Provider value={{ socket, onlineUsers }}>
      {children}
    </SocketContext.Provider>
  );
};

export const SocketData = () => useContext(SocketContext);
