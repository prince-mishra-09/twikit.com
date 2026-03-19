import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import { UserData } from "../../context/UserContext";
import axios from "axios";
import { LoadingAnimation } from "../Loading";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { SocketData } from "../../context/SocketContext";
import { ChatData } from "../../context/ChatContext";

import { FaArrowLeft, FaTimes, FaReply } from "react-icons/fa";
import { IoClose, IoBugOutline } from "react-icons/io5";
import { getOptimizedImage } from "../../utils/imagekitUtils";

const MessageContainer = ({ selectedChat, setChats }) => {
  const [messages, setMessages] = useState([]);
  const { user } = UserData();
  const [loading, setLoading] = useState(false);
  const { socket, onlineUsers } = SocketData();
  const { setSelectedChat } = ChatData();
  const location = useLocation();

  const isBugReport = location.state?.isBugReport && selectedChat?.users?.[0]?.username === "admin_prince";

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
      // console.log("Socket: New Message Received", message);
      // console.log("Socket: Current Chat ID", selectedChat._id);

      if (selectedChat._id === message.chatId) {
        setMessages((prev) => [...prev, message]);
      } else {
        // console.log("Socket: Chat ID Mismatch", selectedChat._id, message.chatId);
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

    socket.on("messageReactionUpdated", ({ messageId, chatId, reactions }) => {
      if (selectedChat._id === chatId) {
        setMessages((prev) =>
          prev.map((msg) => (msg._id === messageId ? { ...msg, reactions } : msg))
        );
      }
    });

    return () => {
      socket.off("newMessage");
      socket.off("messagesRead");
      socket.off("messageDeleted");
      socket.off("messageReactionUpdated");
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
      // console.log(error);
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
      // console.log(error);
    }
  };

  // State for one active menu at a time
  const [activeMessageId, setActiveMessageId] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [highlightedMessageId, setHighlightedMessageId] = useState(null);

  const scrollToMessage = (msgId) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center" });
      setHighlightedMessageId(msgId);
      // Clear highlight after animation
      setTimeout(() => setHighlightedMessageId(null), 2000);
    }
  };
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

      {/* HEADER - Sticky at top */}
      <div className="sticky top-0 w-full flex-none border-b border-[var(--border)] bg-[var(--card-bg)]/100 backdrop-blur-md z-30">
        <div className="max-w-4xl mx-auto w-full flex items-center gap-3 px-4 py-3">
          <button
            onClick={() => setSelectedChat(null)}
            className="md:hidden mr-1 text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--text-primary)]/10"
          >
            <FaArrowLeft />
          </button>
          {otherUser && (
            <>
              <img
                src={getOptimizedImage(otherUser.profilePic?.url, { isProfilePic: true, updatedAt: otherUser.updatedAt, width: 100 })}
                className="w-9 h-9 rounded-full object-cover"
                alt=""
              />
              <div>
                <p className="text-[var(--text-primary)] font-medium">
                  {otherUser.name}
                </p>
                <p className="text-xs text-[var(--text-secondary)]">
                  {isOnline ? (
                    <span className="text-[var(--success)] font-medium">Active now</span>
                  ) : (
                    formatLastSeen(otherUser.lastSeen)
                  )}
                </p>
              </div>
            </>
          )}
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
            className="flex-1 overflow-y-auto bg-[var(--bg-primary)] pt-4 pb-3"
          >
            <div className="max-w-4xl mx-auto w-full px-4 space-y-2">
              {/* Bug Report Guideline Banner */}
              {isBugReport && (
                <div className="mb-6 p-5 rounded-2xl bg-[var(--warning)]/10 border border-[var(--warning)]/20 text-center animate-in fade-in slide-in-from-top duration-700">
                  <div className="flex justify-center mb-3">
                    <div className="p-3 rounded-full bg-[var(--warning)]/20 text-[var(--warning)] shadow-lg shadow-[var(--warning)]/10">
                      <IoBugOutline className="text-3xl" />
                    </div>
                  </div>
                  <h3 className="text-[var(--text-primary)] font-black text-lg mb-1 tracking-tight">Bug Report Mode</h3>
                  <p className="text-[var(--text-secondary)] text-sm max-w-xs mx-auto leading-relaxed">
                    Bhai, please bug ke bare me acche se bataye. Screensots bhi share kar sakte hain!
                  </p>
                </div>
              )}

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
                        onReply={(msg) => {
                          // Vibrate if mobile? (Window.navigator.vibrate)
                          setReplyingTo(msg);
                        }}
                        scrollToMessage={scrollToMessage}
                        highlightedMessageId={highlightedMessageId}
                      />
                    </React.Fragment>
                  );
                })}
            </div>
          </div>

          {/* INPUT AREA */}
          <div className="flex-none border-t border-[var(--border)] bg-[var(--card-bg)]/80 backdrop-blur-md z-10">
            <div className="max-w-4xl mx-auto w-full">
              {/* Reply Preview */}
              {replyingTo && (
                <div className="px-4 py-2 border-[var(--border)] flex items-center justify-between bg-black/5">
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="text-[var(--accent)] shrink-0">
                      <FaReply size={14} />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-[var(--accent)]">
                        Replying to {replyingTo.sender === user?._id ? "yourself" : `@${replyingTo.sender?.username || "user"}`}
                      </p>
                      <p className="text-xs text-[var(--text-secondary)] truncate">
                        {replyingTo.text || (replyingTo.sharedContent ? "Shared content" : "Attachment")}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setReplyingTo(null)}
                    className="p-1.5 hover:bg-[var(--bg-secondary)] rounded-full transition-colors shrink-0"
                  >
                    <IoClose size={18} className="text-[var(--text-secondary)]" />
                  </button>
                </div>
              )}

              <div className="p-2 pb-2 md:pb-2">
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
                    replyingTo={replyingTo}
                    setReplyingTo={setReplyingTo}
                  />
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default MessageContainer;
