import React, { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
        onMouseDown={handleTouchStart} // For Desktop testing
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className={`max-w-[75%] px-4 py-2 text-sm rounded-2xl break-words relative cursor-pointer flex flex-wrap items-end gap-2 shadow-sm transition-opacity duration-200 ${message.status === "sending" ? "opacity-70 pointer-events-none" : "opacity-100"
          } ${ownMessage
            ? "bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] text-white rounded-br-sm"
            : "bg-[#1F2937] text-gray-100 rounded-bl-sm border border-white/10"
          }`}
      >
        {/* SHARED CONTENT CARD */}
        {message.sharedContent && (
          <Link
            to={
              message.sharedContent.type === 'profile'
                ? `/user/${message.sharedContent.contentId}`
                : message.sharedContent.type === 'reel'
                  ? `/reels`
                  : `/post/${message.sharedContent.contentId}`
            }
            className={`block mb-2 rounded-xl overflow-hidden border border-white/10 ${ownMessage ? "bg-white/10" : "bg-black/20"}`}
          >
            {/* Image/Video Preview */}
            {/* Image/Video Preview */}
            <div className={message.sharedContent.type === 'reel' ? "aspect-[9/16] w-32 relative bg-black" : "w-full h-32"}>
              {message.sharedContent.preview?.image && (
                message.sharedContent.type === 'reel' ? (
                  <video
                    src={message.sharedContent.preview.image}
                    className="w-full h-full object-cover absolute inset-0"
                    muted
                    playsInline
                  />
                ) : (
                  <img
                    src={message.sharedContent.preview.image}
                    alt="Shared"
                    className="w-full h-full object-cover"
                  />
                )
              )}
              {message.sharedContent.type === 'reel' && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/10 pointer-events-none">
                  {/* Reel Icon Overlay */}
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white drop-shadow-lg">
                    <path fillRule="evenodd" d="M1.5 6a2.25 2.25 0 012.25-2.25h16.5A2.25 2.25 0 0122.5 6v12a2.25 2.25 0 01-2.25 2.25H3.75A2.25 2.25 0 011.5 18V6zM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0021 18v-1.94l-2.69-2.689a1.5 1.5 0 00-2.12 0l-.88.879.97.97a.75.75 0 11-1.06 1.06l-5.16-5.159a1.5 1.5 0 00-2.12 0L3 16.061zm10.125-7.81a1.125 1.125 0 112.25 0 1.125 1.125 0 01-2.25 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>

            {/* Text Preview */}
            <div className="p-2">
              <p className="text-xs font-semibold truncate opacity-90">@{message.sharedContent.preview?.username}</p>
              <p className={`text-xs truncate ${ownMessage ? "text-gray-200" : "text-gray-400"}`}>
                {message.sharedContent.preview?.title || (
                  message.sharedContent.type === 'profile' ? 'Shared Profile' :
                    message.sharedContent.type === 'reel' ? 'Shared Reel' : 'Shared Post'
                )}
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
      </motion.div>

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

export default React.memo(Message);
