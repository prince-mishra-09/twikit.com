import React, { useState, useEffect, useRef } from "react";
import { BsCheckAll } from "react-icons/bs";
import { Link } from "react-router-dom";

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
        className={`max-w-[75%] px-4 py-2 text-sm rounded-2xl break-words relative cursor-pointer flex flex-wrap items-end gap-2 shadow-sm ${ownMessage
          ? "bg-gradient-to-r from-indigo-500 to-blue-500 text-white rounded-br-sm"
          : "bg-[#1F2937] text-gray-100 rounded-bl-sm border border-white/10"
          }`}
      >
        {/* SHARED CONTENT CARD */}
        {message.sharedContent && (
          <Link
            to={message.sharedContent.type === 'profile' ? `/user/${message.sharedContent.contentId}` : `/post/${message.sharedContent.contentId}`}
            className={`block mb-2 rounded-xl overflow-hidden border border-white/10 ${ownMessage ? "bg-white/10" : "bg-black/20"}`}
          >
            {/* Image Preview */}
            {message.sharedContent.preview?.image && (
              <img
                src={message.sharedContent.preview.image}
                alt="Shared"
                className="w-full h-32 object-cover"
              />
            )}
            {/* Text Preview */}
            <div className="p-2">
              <p className="text-xs font-semibold truncate opacity-90">@{message.sharedContent.preview?.username}</p>
              <p className={`text-xs truncate ${ownMessage ? "text-gray-200" : "text-gray-400"}`}>
                {message.sharedContent.preview?.title || (message.sharedContent.type === 'profile' ? 'Shared Profile' : 'Shared Post')}
              </p>
            </div>
          </Link>
        )}

        {message.text && <span className="break-words max-w-full leading-relaxed block">{message.text}</span>}

        {/* Time & Read Receipt */}
        <div className={`text-[10px] flex items-center gap-1 ml-auto shrink-0 ${ownMessage ? "text-gray-200" : "text-gray-400"}`}>
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
