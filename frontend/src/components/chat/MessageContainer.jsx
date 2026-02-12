import React, { useEffect, useRef, useState } from "react";
import { UserData } from "../../context/UserContext";
import axios from "axios";
import { LoadingAnimation } from "../Loading";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { SocketData } from "../../context/SocketContext";
import { ChatData } from "../../context/ChatContext";

import { FaArrowLeft } from "react-icons/fa";

const MessageContainer = ({ selectedChat, setChats }) => {
  const [messages, setMessages] = useState([]);
  const { user } = UserData();
  const [loading, setLoading] = useState(false);
  const { socket, onlineUsers } = SocketData();
  const { setSelectedChat } = ChatData();

  const otherUser = selectedChat?.users?.[0];
  const isOnline = otherUser ? onlineUsers.includes(otherUser._id) : false;
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
    if (otherUser && prevIsOnline.current && !isOnline) {
      const now = new Date().toISOString();
      setSelectedChat(prev => ({
        ...prev,
        users: prev.users?.map(u => u._id === otherUser._id ? { ...u, lastSeen: now } : u)
      }));
      setChats(prev => prev.map(chat => {
        if (chat._id === selectedChat?._id) {
          return {
            ...chat,
            users: chat.users?.map(u => u._id === otherUser._id ? { ...u, lastSeen: now } : u)
          };
        }
        return chat;
      }));
    }
    prevIsOnline.current = isOnline;
  }, [isOnline, otherUser?._id, selectedChat?._id, setChats, setSelectedChat]);

  useEffect(() => {
    socket.on("newMessage", (message) => {
      console.log("Socket: New Message Received", message);
      console.log("Socket: Current Chat ID", selectedChat._id);

      if (selectedChat._id === message.chatId) {
        setMessages((prev) => [...prev, message]);
      } else {
        console.log("Socket: Chat ID Mismatch", selectedChat._id, message.chatId);
      }
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
      if (!selectedChat?.users?.[0]?._id) return;
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
  }, [selectedChat?._id]);

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

  // State for one active menu at a time
  const [activeMessageId, setActiveMessageId] = useState(null);

  // Helper for dates
  const formatDateLabel = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();

    // Check Yesterday
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();

    if (isToday) return "Today";
    if (isYesterday) return "Yesterday";

    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' });
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex flex-col bg-[var(--bg-primary)] md:relative md:h-full"
      onClick={() => setActiveMessageId(null)} // Close menu on click outside
    >

      {/* HEADER - Fixed at top */}
      <div className="absolute top-0 left-0 w-full flex-none flex items-center gap-3 px-4 py-3 border-b border-[var(--border)] bg-[var(--card-bg)]/100 backdrop-blur-md z-30">
        <button
          onClick={() => setSelectedChat(null)}
          className="md:hidden mr-1 text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--text-primary)]/10"
        >
          <FaArrowLeft />
        </button>
        {otherUser && (
          <>
            <img
              src={otherUser.profilePic?.url}
              className="w-9 h-9 rounded-full object-cover"
              alt=""
            />
            <div>
              <p className="text-[var(--text-primary)] font-medium">
                {otherUser.name}
              </p>
              <p className="text-xs text-[var(--text-secondary)]">
                {isOnline ? (
                  <span className="text-green-400 font-medium">Active now</span>
                ) : (
                  formatLastSeen(otherUser.lastSeen)
                )}
              </p>
            </div>
          </>
        )}
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
            className="flex-1 overflow-y-auto px-4 pt-20 pb-3 space-y-2 bg-[var(--bg-primary)]"
          >
            {messages &&
              messages.map((e, i) => {
                // Date Separator Logic
                const currentDateLabel = formatDateLabel(e.createdAt);
                const prevDateLabel = i > 0 ? formatDateLabel(messages[i - 1].createdAt) : null;
                const showDateSeparator = currentDateLabel !== prevDateLabel;

                return (
                  <React.Fragment key={i}>
                    {showDateSeparator && (
                      <div className="flex justify-center my-4">
                        <span className="bg-[var(--bg-secondary)] text-[var(--text-secondary)] text-xs px-3 py-1 rounded-full border border-[var(--border)]">
                          {currentDateLabel}
                        </span>
                      </div>
                    )}
                    <Message
                      message={e}
                      ownMessage={e.sender === user._id}
                      isRead={e.isRead}
                      deleteHandler={deleteMessageHandler}
                      activeMessageId={activeMessageId}
                      setActiveMessageId={setActiveMessageId}
                    />
                  </React.Fragment>
                );
              })}
          </div>

          {/* INPUT */}
          <div className="flex-none border-t border-[var(--border)] bg-[var(--card-bg)]/80 backdrop-blur-md z-10 p-2 pb-4 md:pb-2">
            {otherUser?.isPrivate && !user?.followings?.includes(otherUser._id) ? (
              <div className="flex justify-center items-center py-4 bg-[var(--bg-secondary)]/30 rounded-lg mx-2 my-1 border border-[var(--border)]">
                <p className="text-[var(--text-secondary)] text-sm">
                  Follow <span className="font-bold text-[var(--text-primary)]">@{otherUser.username}</span> to message them
                </p>
              </div>
            ) : (
              <MessageInput
                setMessages={setMessages}
                selectedChat={selectedChat}
              />
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default MessageContainer;
