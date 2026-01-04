import React, { useEffect, useRef, useState } from "react";
import { UserData } from "../../context/UserContext";
import axios from "axios";
import { LoadingAnimation } from "../Loading";
import Message from "./Message";
import MessageInput from "./MessageInput";
import { SocketData } from "../../context/SocketContext";

const MessageContainer = ({ selectedChat, setChats }) => {
  const [messages, setMessages] = useState([]);
  const { user } = UserData();
  const [loading, setLoading] = useState(false);
  const { socket } = SocketData();

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

    return () => socket.off("newMessage");
  }, [socket, selectedChat, setChats]);

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

  return (
    <div className="flex flex-col h-full bg-[#0B0F14]">

      {/* HEADER */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-[#111827]/80 backdrop-blur-md">
        <img
          src={selectedChat.users[0].profilePic.url}
          className="w-9 h-9 rounded-full object-cover"
          alt=""
        />
        <div>
          <p className="text-white font-medium">
            {selectedChat.users[0].name}
          </p>
          <p className="text-xs text-gray-400">Active now</p>
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
                  message={e.text}
                  ownMessage={e.sender === user._id}
                />
              ))}
          </div>

          {/* INPUT */}
          <div className="border-t border-white/10 bg-[#111827]/80 backdrop-blur-md">
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
