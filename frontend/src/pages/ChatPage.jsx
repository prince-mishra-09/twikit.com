import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatData } from "../context/ChatContext";
import axios from "axios";
import { FaSearch, FaArrowLeft } from "react-icons/fa";
import Chat from "../components/chat/Chat";
import MessageContainer from "../components/chat/MessageContainer";
import { SocketData } from "../context/SocketContext";
import { SkeletonUserList } from "../components/Skeleton";

const ChatPage = ({ user }) => {
  const navigate = useNavigate();
  const { createChat, selectedChat, setSelectedChat, chats, setChats } =
    ChatData();

  const [users, setUsers] = useState([]);
  const [query, setQuery] = useState("");
  const [search, setSearch] = useState(false);

  const { onlineUsers } = SocketData();

  useEffect(() => {
    if (selectedChat) {
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
          console.log(error);
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
    <div className="h-[100dvh] bg-[#0B0F14] flex justify-center md:px-2 md:py-4">
      <div className="w-full max-w-6xl h-full md:h-[85vh] bg-[#111827]/80 backdrop-blur-xl border border-white/10 md:rounded-2xl shadow-xl flex overflow-hidden">

        {/* ================= LEFT SIDEBAR ================= */}
        <div
          className={`${selectedChat ? "hidden md:flex" : "flex"
            } w-full md:w-[30%] border-r border-white/10 flex-col`}
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate("/")}
                className="text-white p-2 rounded-full hover:bg-white/10"
              >
                <FaArrowLeft />
              </button>
              <h2 className="text-white font-semibold">Chats</h2>
            </div>
            <button
              onClick={() => setSearch(!search)}
              className="bg-indigo-500 text-white p-2 rounded-full hover:opacity-90"
            >
              {search ? "✕" : <FaSearch />}
            </button>
          </div>

          {/* Search bar (ALWAYS TOP) */}
          <div className="px-4 pb-3">
            <input
              type="text"
              className="w-full px-3 py-2 rounded-lg bg-[#0B0F14] border border-white/10 text-white placeholder-gray-400"
              placeholder="Search users..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          {/* Chat / User list */}
          <div className="flex-1 overflow-y-auto px-2 space-y-2">
            {search ? (
              users.length > 0 ? (
                users.map((u) => (
                  <div
                    key={u._id}
                    onClick={() => createNewChat(u._id)}
                    className="flex items-center gap-3 px-3 py-2 rounded-xl cursor-pointer bg-[#0B0F14]/60 hover:bg-[#0B0F14]"
                  >
                    <img
                      src={u.profilePic.url}
                      className="w-9 h-9 rounded-full object-cover"
                      alt=""
                    />
                    <div className="flex flex-col">
                      <p className="text-white text-sm font-semibold">@{u.username}</p>
                      <p className="text-gray-500 text-xs">{u.name}</p>
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-400 text-sm text-center mt-4">
                  No users found
                </p>
              )
            ) : chats.length > 0 ? (
              chats.map((c) => (
                <Chat
                  key={c._id}
                  chat={c}
                  setSelectedChat={setSelectedChat}
                  isOnline={onlineUsers.includes(c.users[0]._id)}
                  unreadCount={c.unreadCount}
                />
              ))
            ) : (
              <p className="text-gray-400 text-sm text-center mt-4">
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
                <p className="text-2xl text-white font-semibold">
                  Hello {user?.name || "User"} 👋
                </p>
                <p className="text-gray-400 mt-2">
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
