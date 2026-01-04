import React from "react";

const Message = ({ ownMessage, message }) => {
  return (
    <div
      className={`flex mb-2 ${
        ownMessage ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] px-4 py-2 text-sm rounded-2xl break-words ${
          ownMessage
            ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-br-sm"
            : "bg-[#1F2937]/80 backdrop-blur-md text-gray-100 rounded-bl-sm border border-white/10"
        }`}
      >
        {message}
      </div>
    </div>
  );
};

export default Message;
