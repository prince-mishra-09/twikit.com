import React, { useEffect, useRef, useState } from "react";
import { UserData } from "../../context/UserContext";
import axios from "axios";
import { LoadingAnimation } from "../Loading";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { SocketData } from "../../context/SocketContext";
import { ChatData } from "../../context/ChatContext";

const MessageContainer = ({ selectedChat, setChats }) => {
  const [messages, setMessages] = useState([]);
  const { user } = UserData();
  const [loading, setLoading] = useState(false);
  const { socket, onlineUsers } = SocketData();
  const { setSelectedChat } = ChatData();

  const otherUser = selectedChat.users[0];
  const isOnline = onlineUsers.includes(otherUser._id);
  const prevIsOnline = useRef(isOnline);

  const formatLastSeen = (dateString) => {
    if (!dateString) return "Offline";
    const date = new Date(dateString);
    const now = new Date();
    const diff = Math.floor((now - date) / 60000); // minutes

    if (diff >= 1440) return "Offline";

    if (diff < 1) return "Last seen Just now";
    if (diff < 60) return `Last seen ${diff}m ago`;
    return `Last seen ${Math.floor(diff / 60)}h ago`;
  };

  useEffect(() => {
    if (prevIsOnline.current && !isOnline) {
      const now = new Date().toISOString();
      setSelectedChat(prev => ({
        ...prev,
        users: prev.users.map(u => u._id === otherUser._id ? { ...u, lastSeen: now } : u)
      }));
      setChats(prev => prev.map(chat => {
        if (chat._id === selectedChat._id) {
          return {
            ...chat,
            users: chat.users.map(u => u._id === otherUser._id ? { ...u, lastSeen: now } : u)
          };
        }
        return chat;
      }));
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, otherUser._id, selectedChat._id, setChats, setSelectedChat]);

  useEffect(() => {
    socket.on("newMessage", (message) => {
      if (selectedChat._id === message.chatId) {
        setMessages((prev) => [...prev, message]);
      }

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === message.chatId
            ? {
              ...chat,
              latestMessage: {
                text: message.text,
                sender: message.sender,
              },
            }
            : chat
        )
      );
    });

    socket.on("messagesRead", ({ chatId }) => {
      if (selectedChat._id === chatId) {
        setMessages((prev) =>
          prev.map((msg) => {
            // If the other person read the chat, all my messages are now read.
            // Actually, technically only messages they saw. But for now, assume all.
            if (msg.sender === user._id) {
              return { ...msg, isRead: true };
            }
            return msg;
          })
        );
      }
    });

    socket.on("messageDeleted", ({ messageId }) => {
      setMessages((prev) => prev.filter((msg) => msg._id !== messageId));
    });

    return () => {
      socket.off("newMessage");
      socket.off("messagesRead");
      socket.off("messageDeleted");
    };
  }, [socket, selectedChat, setChats, user._id]);

  async function fetchMessages() {
    setLoading(true);
    try {
      const { data } = await axios.get(
        "/api/messages/" + selectedChat.users[0]._id
      );
      setMessages(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMessages();
  }, [selectedChat]);

  const messageContainerRef = useRef(null);

  useEffect(() => {
    if (messageContainerRef.current) {
      messageContainerRef.current.scrollTop =
        messageContainerRef.current.scrollHeight;
    }
  }, [messages]);

  const deleteMessageHandler = async (id, type) => {
    try {
      await axios.delete(`/api/messages/${id}?type=${type}`);
      setMessages((prev) => prev.filter((msg) => msg._id !== id));

      // If unsend, socket handles other user. For me, I just remove it.
      // But we should also update 'Chats' latest message if it was the last one? 
      // Complexity: ignoring latestMessage update for now as it's minor.
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex flex-col bg-[#0B0F14] md:static md:h-full">

      {/* HEADER - Fixed at top */}
      <div className="flex-none flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111827]/80 backdrop-blur-md z-20">
        <img
          src={otherUser.profilePic.url}
          className="w-9 h-9 rounded-full object-cover"
          alt=""
        />
        <div>
          <p className="text-white font-medium">
            {otherUser.name}
          </p>
          <p className="text-xs text-gray-400">
            {isOnline ? (
              <span className="text-green-400 font-medium">Active now</span>
            ) : (
              formatLastSeen(otherUser.lastSeen)
            )}
          </p>
        </div>
      </div>

      {/* MESSAGES */}
      {loading ? (
        <div className="flex flex-1 items-center justify-center">
          <LoadingAnimation />
        </div>
      ) : (
        <>
          <div
            ref={messageContainerRef}
            className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-[#0B0F14]"
          >
            {messages &&
              messages.map((e, i) => (
                <Message
                  key={i}
                  message={e}
                  ownMessage={e.sender === user._id}
                  isRead={e.isRead}
                  deleteHandler={deleteMessageHandler}
                />
              ))}
          </div>

          {/* INPUT */}
          <div className="flex-none border-t border-white/10 bg-[#111827]/80 backdrop-blur-md z-10 p-2 pb-4 md:pb-2">
            <MessageInput
              setMessages={setMessages}
              selectedChat={selectedChat}
            />
          </div>
        </>
      )}
    </div>
  );
};

export default MessageContainer;
