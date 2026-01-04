import React, { useState } from "react";
import { ChatData } from "../../context/ChatContext";
import toast from "react-hot-toast";
import axios from "axios";
import { BsSendFill } from "react-icons/bs";

const MessageInput = ({ setMessages, selectedChat }) => {
  const [textMsg, setTextMsg] = useState("");
  const { setChats } = ChatData();

  const handleMessage = async (e) => {
    e.preventDefault();
    if (!textMsg.trim()) return;

    try {
      const { data } = await axios.post("/api/messages", {
        message: textMsg,
        recieverId: selectedChat.users[0]._id,
      });

      setMessages((message) => [...message, data]);
      setTextMsg("");

      setChats((prev) =>
        prev.map((chat) =>
          chat._id === selectedChat._id
            ? {
                ...chat,
                latestMessage: {
                  text: textMsg,
                  sender: data.sender,
                },
              }
            : chat
        )
      );
    } catch (error) {
      console.log(error);
      toast.error(error.response.data.message);
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
