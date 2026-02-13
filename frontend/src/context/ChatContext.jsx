import axios from "axios";
import { createContext, useContext, useEffect, useState, useMemo, useCallback } from "react";
import toast from "react-hot-toast";
import { SocketData } from "./SocketContext";
import { UserData } from "./UserContext";

const ChatContext = createContext();

export const ChatContextProvider = ({ children }) => {
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [totalUnreadMessages, setTotalUnreadMessages] = useState(0);

  const { socket } = SocketData();
  const { user } = UserData();

  const getAllChats = useCallback(async () => {
    try {
      const { data } = await axios.get("/api/messages/chats");
      setChats(data);
    } catch (error) {
      // console.log(error);
    }
  }, []);

  useEffect(() => {
    if (user) {
      getAllChats();
    }
  }, [user]);

  // Accumulate total unread count from all chats
  useEffect(() => {
    // Count number of CHATS with unread messages, not total unread messages
    const total = chats.filter((chat) => chat.unreadCount > 0).length;
    setTotalUnreadMessages(total);
  }, [chats]);

  // LISTEN FOR LIVE MESSAGES
  useEffect(() => {
    if (socket && user) {
      socket.on("newMessage", (newMessage) => {
        setChats((prevChats) => {
          // Check if chat exists
          const chatIndex = prevChats.findIndex(
            (c) => c._id === newMessage.chatId
          );

          if (chatIndex !== -1) {
            // Chat exists, update it
            const updatedChats = [...prevChats];
            const chat = updatedChats[chatIndex];

            // If we are NOT currently reading this chat, increment unread
            const isCurrentChat = selectedChat && selectedChat._id === chat._id;

            updatedChats[chatIndex] = {
              ...chat,
              latestMessage: {
                text: newMessage.text,
                sender: newMessage.sender,
              },
              updatedAt: new Date().toISOString(), // Force update time
              unreadCount: isCurrentChat ? chat.unreadCount : (chat.unreadCount || 0) + 1,
            };
            // Move to top
            updatedChats.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
            return updatedChats;
          } else {
            // New chat (rare case if not refreshed, but handle it if we fetched chat details?
            // For now, simpler to just re-fetch chats or ignore until refresh
            // But valid "newMessage" means chat *should* exist or be created?
            // Let's just return prev if not found, or maybe re-fetch?
            return prevChats;
          }
        });
      });

      socket.on("messagesRead", ({ chatId, readerId }) => {
        setChats(prev => prev.map(chat => {
          if (chat._id === chatId) {
            // If I am the sender, my messages are read ??
            // Actually this event tells ME that SOMEONE read MY messages.
            // But here we are displaying UNREAD counts for Incoming messages.
            // So we only care if WE read messages?
            // Wait, "messagesRead" is emitted to the SENDER.
            // So if I get this, it means the OTHER person read MY messages.
            // This is for TICKS.
            //
            // HOWEVER, if I read messages, I need to update MY unread count locally.
            // This should handle "I read a message" -> set unreadCount = 0.
            // That logic should happen when I OPEN the chat.
            return chat;
          }
          return chat;
        }))
      });

      return () => {
        socket.off("newMessage");
        socket.off("messagesRead");
      };
    }
  }, [socket, user, selectedChat]);

  const createChat = useCallback(async (id) => {
    try {
      const { data } = await axios.post("/api/messages", {
        recieverId: id,
      });

      // Update local chats state if new
      if (!chats.find((c) => c._id === data._id)) {
        setChats((prev) => [data, ...prev]);
      }

      return data;
    } catch (error) {
      toast.error(error.response?.data?.message);
      // console.log(error);
    }
  }, [chats]);

  const value = useMemo(() => ({
    createChat, selectedChat, setSelectedChat, chats,
    setChats, totalUnreadMessages, setTotalUnreadMessages, getAllChats
  }), [createChat, selectedChat, chats, totalUnreadMessages, getAllChats]);

  return (
    <ChatContext.Provider value={value}>
      {children}
    </ChatContext.Provider>
  );
};

export const ChatData = () => useContext(ChatContext);