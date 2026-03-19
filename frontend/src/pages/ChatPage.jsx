import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ChatData } from "../context/ChatContext";
import axios from "axios";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import Chat from "../components/chat/Chat";
import MessageContainer from "../components/chat/MessageContainer";
import { SocketData } from "../context/SocketContext";
import { SkeletonUserList } from "../components/Skeleton";
import { getOptimizedImage } from "../utils/imagekitUtils";

const ChatPage = ({ user }) => {
  const navigate = useNavigate();
  const { createChat, selectedChat, setSelectedChat, chats, setChats } =
    ChatData();

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(false);

  const { onlineUsers } = SocketData();

  // Sort chats by latest interaction for the sidebar
  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  }, [chats]);

  useEffect(() => {
    if (selectedChat && selectedChat._id) {
      const markRead = async () => {
        try {
          await axios.put(`/api/messages/read/${selectedChat._id}`);

          setChats(prev => prev.map(c => {
            if (c._id === selectedChat._id) {
              return { ...c, unreadCount: 0 };
            }
            return c;
          }));
        } catch (error) {
          // console.log(error);
        }
      };

      markRead();
    }
  }, [selectedChat]);

  /* ================= FETCH ================= */

  async function fetchAllUsers() {
    if (!query || query.trim() === "") {
      setUsers([]);
      return;
    }

    try {
      const { data } = await axios.get(
        "/api/user/all?search=" + query.trim()
      );
      setUsers(data.users || []);
    } catch (error) {
      console.log(error);
    }
  }

  useEffect(() => {
    const handler = setTimeout(() => {
      if (query.trim()) {
        fetchAllUsers();
      } else {
        setUsers([]);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(handler);
  }, [query]);

  async function createNewChat(id) {
    const chat = await createChat(id);
    setSearch(false);
    setSelectedChat(chat);
  }

  /* ================= UI ================= */

  return (
    <div className="h-[100dvh] bg-[var(--bg-primary)] flex justify-center md:px-2 md:py-2">
      <div className="w-full h-full md:h-[98vh] bg-[var(--card-bg)] backdrop-blur-xl border border-[var(--border)] md:rounded-2xl shadow-xl flex overflow-hidden">

        {/* ================= LEFT SIDEBAR ================= */}
        <div
          className={`${selectedChat ? "hidden md:flex" : "flex"
            } w-full md:w-[30%] border-r border-[var(--border)] flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="text-[var(--text-primary)] p-2 rounded-full hover:bg-[var(--text-primary)]/10"
              >
                <FaArrowLeft />
              </button>
              <h2 className="text-[var(--text-primary)] font-semibold">Chats</h2>
            </div>
            <button
              onClick={() => setSearch(!search)}
              className="bg-[var(--bg-primary)] border border-[var(--border)] hover:bg-[var(--bg-secondary)] text-[var(--accent)] p-2 rounded-full transition-all"
            >
              {search ? "✕" : <FaSearch />}
            </button>
          </div>

          {/* Search bar (ALWAYS TOP) */}
          <div className="px-4 pb-3">
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg bg-[var(--bg-primary)] border border-[var(--border)] text-[var(--text-primary)] placeholder-[var(--text-secondary)]"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Chat / User list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-1">
            {search ? (
              users.length > 0 ? (
                users.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => createNewChat(u._id)}
                    className="flex items-center gap-3 px-3 py-2 hover:bg-[var(--text-primary)]/5 transition-all cursor-pointer"
                  >
                    <img
                      src={getOptimizedImage(u.profilePic.url, { isProfilePic: true, updatedAt: u.updatedAt, width: 100 })}
                      className="w-10 h-10 rounded-full object-cover border border-[var(--border)]"
                      alt=""
                    />
                    <div className="flex flex-col">
                      <p className="text-[var(--text-primary)] text-sm font-semibold truncate">@{u.username}</p>
                      <p className="text-[var(--text-secondary)] text-[10px]">{u.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-[var(--text-secondary)] text-sm text-center mt-4">
                  No users found
                </p>
              )
            ) : sortedChats.length > 0 ? (
              sortedChats.map((c) => (
                <Chat
                  key={c._id}
                  chat={c}
                  setSelectedChat={setSelectedChat}
                  isOnline={c.users && c.users[0] ? onlineUsers.includes(c.users[0]._id) : false}
                  unreadCount={c.unreadCount}
                />
              ))
            ) : (
              <p className="text-[var(--text-secondary)] text-sm text-center mt-4">
                No chats yet
              </p>
            )}
          </div>
        </div>

        {/* ================= RIGHT PANEL ================= */}
        <div
          className={`${selectedChat ? "flex" : "hidden md:flex"
            } flex-1 flex flex-col`}
        >
          {selectedChat === null ? (
            <div className="flex flex-1 items-center justify-center text-center px-4">
              <div>
                <p className="text-2xl text-[var(--text-primary)] font-semibold">
                  Hello {user?.name || "User"} 👋
                </p>
                <p className="text-[var(--text-secondary)] mt-2">
                  Select a chat to start conversation
                </p>
              </div>
            </div>
          ) : (
            <MessageContainer
              selectedChat={selectedChat}
              setChats={setChats}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
