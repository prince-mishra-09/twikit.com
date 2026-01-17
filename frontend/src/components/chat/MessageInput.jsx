import React, { useState } from "react";
import { ChatData } from "../../context/ChatContext";
import toast from "react-hot-toast";
import axios from "axios";
import { BsSendFill } from "react-icons/bs";
import { UserData } from "../../context/UserContext";

const MessageInput = ({ setMessages, selectedChat }) => {
  const [textMsg, setTextMsg] = useState("");
  const { setChats } = ChatData();
  const { user } = UserData();

  const handleMessage = async (e) => {
    e.preventDefault();
    if (!textMsg.trim()) return;

    const messageText = textMsg;
    setTextMsg(""); // Clear input immediately

    // 1. CREATE OPTIMISTIC MESSAGE
    const optimisticMessage = {
      _id: "temp_" + Date.now(),
      text: messageText,
      sender: user._id, // We need 'user' from UserData()
      createdAt: new Date().toISOString(),
      status: "sending"
    };

    // 2. UPDATE MESSAGES LIST INSTANTLY
    setMessages((prev) => [...prev, optimisticMessage]);

    // 3. UPDATE CHAT SIDEBAR INSTANTLY
    setChats((prev) => {
      const otherChats = prev.filter(chat => chat._id !== selectedChat._id);
      const currentChat = prev.find(chat => chat._id === selectedChat._id);

      if (currentChat) {
        const updatedChat = {
          ...currentChat,
          latestMessage: {
            text: messageText,
            sender: user._id,
          },
          updatedAt: new Date().toISOString(),
        };
        return [updatedChat, ...otherChats];
      }
      return prev;
    });

    try {
      const { data } = await axios.post("/api/messages", {
        message: messageText,
        recieverId: selectedChat.users[0]._id,
      });

      // 4. REPLACE OPTIMISTIC MESSAGE WITH REAL ONE
      setMessages((prev) =>
        prev.map((msg) => (msg._id === optimisticMessage._id ? data : msg))
      );
    } catch (error) {
      console.log(error);
      toast.error(error.response?.data?.message || "Failed to send message");

      // 5. REMOVE OPTIMISTIC MESSAGE ON FAILURE (or show retry)
      setMessages((prev) => prev.filter((msg) => msg._id !== optimisticMessage._id));
    }
  };

  return (
    <form
      onSubmit={handleMessage}
      className="flex items-center gap-3 px-4 py-3"
    >
      {/* INPUT */}
      <input
        type="text"
        placeholder="Message..."
        className="flex-1 px-4 py-2 rounded-full bg-[#0B0F14] border border-white/10 text-white placeholder-gray-400 focus:outline-none focus:border-indigo-400"
        value={textMsg}
        onChange={(e) => setTextMsg(e.target.value)}
      />

      {/* SEND BUTTON */}
      <button
        type="submit"
        disabled={!textMsg.trim()}
        className="bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white p-3 rounded-full transition"
      >
        <BsSendFill />
      </button>
    </form>
  );
};

export default MessageInput;
