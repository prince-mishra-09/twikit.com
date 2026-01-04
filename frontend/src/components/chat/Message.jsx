import React from "react";
import { BsCheckAll } from "react-icons/bs";

const Message = ({ ownMessage, message, isRead }) => {
  return (
    <div
      className={`flex mb-2 ${ownMessage ? "justify-end" : "justify-start"
        }`}
    >
      <div
        className={`max-w-[75%] px-4 py-2 text-sm rounded-2xl break-words relative ${ownMessage
            ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-br-sm pr-9"
            : "bg-[#1F2937]/80 backdrop-blur-md text-gray-100 rounded-bl-sm border border-white/10"
          }`}
      >
        {message}

        {/* Read Receipt Ticks */}
        {ownMessage && (
          <div className={`absolute bottom-1 right-2 text-xs ${isRead ? "text-cyan-200" : "text-gray-300"}`}>
            <BsCheckAll className="text-lg" />
          </div>
        )}
      </div>
    </div>
  );
};

export default Message;
