import React, { useState, useEffect, useRef } from "react";
import { BsCheckAll } from "react-icons/bs";

const Message = ({ ownMessage, message, isRead, deleteHandler, activeMessageId, setActiveMessageId }) => {
  const longPressTimer = useRef(null);

  const handleTouchStart = () => {
    if (!ownMessage) return;
    longPressTimer.current = setTimeout(() => {
      setActiveMessageId(message._id);
    }, 500);
  };

  const handleTouchEnd = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  };

  // Close menu when clicking outside handled by Container now (or specific overlay)
  // But for simple click outside logic, we rely on Container's click handler or a transparent overlay.

  return (
    <div
      className={`flex mb-2 ${ownMessage ? "justify-end" : "justify-start"} relative select-none`}
    >
      <div
        onMouseDown={handleTouchStart} // For Desktop testing
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`max-w-[75%] px-4 py-2 pb-6 text-sm rounded-2xl break-words relative cursor-pointer ${ownMessage
          ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-br-sm pr-9"
          : "bg-[#1F2937]/80 backdrop-blur-md text-gray-100 rounded-bl-sm border border-white/10"
          }`}
      >
        {message.text}

        {/* Time & Read Receipt */}
        <div className={`absolute bottom-1 right-3 text-[10px] flex items-center gap-1 ${ownMessage ? "text-gray-200" : "text-gray-400"}`}>
          <span>{
            message.createdAt
              ? new Date(message.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
              : ""
          }</span>
          {ownMessage && (
            <BsCheckAll className={`text-sm ${isRead ? "text-cyan-200" : "text-gray-200"}`} />
          )}
        </div>
      </div>

      {/* Long Press Menu - Top Left */}
      {activeMessageId === message._id && ownMessage && (
        <div className={`absolute top-0 right-10 mt-0 z-30 bg-[#1F2937] border border-white/10 rounded-lg shadow-xl overflow-hidden min-w-[120px] flex flex-col`}>
          <button
            onClick={(e) => { e.stopPropagation(); deleteHandler(message._id, "unsend"); setActiveMessageId(null); }}
            className="px-4 py-2 text-left text-sm text-red-400 hover:bg-white/5 border-b border-white/5"
          >
            Unsend
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); deleteHandler(message._id, "delete"); setActiveMessageId(null); }}
            className="px-4 py-2 text-left text-sm text-gray-300 hover:bg-white/5"
          >
            Delete for me
          </button>
        </div>
      )}
    </div>
  );
};

export default Message;
