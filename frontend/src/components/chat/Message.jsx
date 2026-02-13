import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform } from "framer-motion";
import { BsCheckAll } from "react-icons/bs";
import { Link } from "react-router-dom";
import { FaReply } from "react-icons/fa";
import { UserData } from "../../context/UserContext";

const Message = ({ ownMessage, message, isRead, deleteHandler, activeMessageId, setActiveMessageId, onReply, scrollToMessage, highlightedMessageId }) => {
  const { user } = UserData();
  const longPressTimer = useRef(null);
  const x = useMotionValue(0);

  // Transform x into opacity and scale for the reply indicator
  // Threshold is 60. We want it fully visible at 50-60.
  const opacityValue = useTransform(x,
    ownMessage ? [0, -60] : [0, 60],
    [0, 1]
  );
  const scaleValue = useTransform(x,
    ownMessage ? [0, -60] : [0, 60],
    [0.5, 1.2]
  );

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

  const isMediaOnly = message.sharedContent && (message.sharedContent.type === 'post' || message.sharedContent.type === 'reel') && !message.text;

  return (
    <div
      id={`msg-${message._id}`}
      className={`flex mb-1.5 ${ownMessage ? "justify-end" : "justify-start"} relative select-none`}
    >
      {/* Fixed Reply Indicator (Behind the swipe) */}
      <motion.div
        style={{
          opacity: opacityValue,
          scale: scaleValue,
          [ownMessage ? 'right' : 'left']: '20px'
        }}
        className="absolute top-1/2 -translate-y-1/2 z-0 pointer-events-none"
      >
        <div className="bg-[var(--accent)] p-2 rounded-full shadow-lg">
          <FaReply className="text-[var(--text-on-accent)] text-xs" />
        </div>
      </motion.div>

      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{ x }}
        transition={{ type: "spring", damping: 15, stiffness: 300 }}
        onMouseDown={handleTouchStart} // For Desktop testing
        onMouseUp={handleTouchEnd}
        onMouseLeave={handleTouchEnd}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        drag="x"
        dragConstraints={ownMessage ? { left: -100, right: 0 } : { left: 0, right: 100 }}
        dragSnapToOrigin={true}
        dragElastic={ownMessage ? { right: 0, left: 0.6 } : { left: 0, right: 0.6 }}
        onDragEnd={(e, info) => {
          const threshold = 60;
          if (ownMessage && info.offset.x < -threshold) {
            onReply(message);
          } else if (!ownMessage && info.offset.x > threshold) {
            onReply(message);
          }
        }}
        className={`max-w-[78%] sm:max-w-[85%] break-words relative cursor-pointer flex flex-col transition-opacity duration-200 z-10 ${message.status === "sending" ? "opacity-70 pointer-events-none" : "opacity-100"
          } ${highlightedMessageId === message._id ? 'highlight-message' : ''} ${isMediaOnly
            ? "p-0 bg-transparent shadow-none"
            : `px-3 py-1 sm:px-4 sm:py-2 text-[13px] sm:text-sm rounded-2xl shadow-sm ${ownMessage
              ? "bg-[#3a82ee] text-white rounded-br-sm"
              : "bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border)]"}`}
          }`}
      >
        {/* Replying To Preview (Inside Bubble) */}
        {message.replyTo && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              scrollToMessage(message.replyTo._id);
            }}
            className={`mb-2 p-2 rounded-lg text-[11px] border-l-4 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${ownMessage
              ? "bg-black/20 border-white/40 text-white/80"
              : "bg-[var(--bg-primary)] border-[var(--accent)] text-[var(--text-secondary)]"
              }`}>
            <p className="font-bold mb-0.5">
              Replying to {message.replyTo.sender?.username === user?.username ? "you" : `@${message.replyTo.sender?.username}`}
            </p>
            <p className="line-clamp-1 italic">
              {message.replyTo.text || (message.replyTo.sharedContent ? "Shared content" : "Attachment")}
            </p>
          </div>
        )}

        {message.sharedContent && (
          <div className="w-full relative">
            <Link
              to={
                message.sharedContent.type === 'profile'
                  ? `/user/${message.sharedContent.contentId}`
                  : message.sharedContent.type === 'reel'
                    ? `/reels`
                    : `/post/${message.sharedContent.contentId}`
              }
              className={`block overflow-hidden transition-all ${message.sharedContent.type === 'profile' ? 'mb-1 rounded-xl border border-white/10 p-2 bg-black/10' : 'rounded-lg'
                }`}
            >
              {/* Media Preview (Post/Reel) */}
              {(message.sharedContent.type === 'post' || message.sharedContent.type === 'reel') ? (
                <div className={`relative w-48 sm:w-80 max-w-full ${message.sharedContent.type === 'reel' ? 'aspect-[9/16]' : 'aspect-[3/4]'} bg-black shadow-lg`}>
                  {message.sharedContent.preview?.image && (
                    message.sharedContent.type === 'reel' ? (
                      <video
                        src={message.sharedContent.preview.image}
                        className="w-full h-full object-cover"
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

                  {/* Discrete Timestamp for Media Shares (Positioned at Bottom) */}
                  <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-white/70 drop-shadow-md font-medium">
                    <span>{
                      message.createdAt
                        ? new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : ""
                    }</span>
                    {ownMessage && (
                      <BsCheckAll className={`text-xs ${isRead ? "text-[var(--accent)]" : "opacity-60"}`} />
                    )}
                  </div>
                </div>
              ) : (
                /* Redesigned Profile Share Style: Horizontal & Compact + Integrated Timestamp */
                <div className="flex items-center gap-3 py-1 w-56 sm:w-80 pr-16 relative group">
                  <div className="w-10 h-10 shrink-0">
                    <img
                      src={message.sharedContent.preview?.image || "/default-avatar.png"}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border border-white/20"
                    />
                  </div>
                  <div className="flex flex-col min-w-0 flex-1">
                    <p className="text-sm font-bold truncate opacity-95">
                      {message.sharedContent.preview?.title || message.sharedContent.preview?.username}
                    </p>
                    <p className={`text-[10px] truncate ${ownMessage ? "opacity-70" : "text-[var(--text-secondary)]"}`}>
                      @{message.sharedContent.preview?.username}
                    </p>
                  </div>
                  {/* Timestamp inside Profile Container */}
                  <div className={`absolute right-1.5 bottom-1 flex items-center gap-1 text-[9px] ${ownMessage ? "text-[var(--text-on-accent)]/60" : "text-[var(--text-secondary)]"}`}>
                    <span>{
                      message.createdAt
                        ? new Date(message.createdAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })
                        : ""
                    }</span>
                    {ownMessage && (
                      <BsCheckAll className={`text-sm ${isRead ? "text-current" : "opacity-60"}`} />
                    )}
                  </div>
                </div>
              )}
            </Link>
          </div>
        )}

        {message.text && (
          <div className="w-full">
            <span className="break-words max-w-full leading-relaxed block">{message.text}</span>
          </div>
        )}

        {/* Global Timestamp & Read Receipt (Bottom Aligned for Text) */}
        {!isMediaOnly && message.sharedContent?.type !== 'post' && message.sharedContent?.type !== 'reel' && message.sharedContent?.type !== 'profile' && (
          <div className={`text-[9px] flex items-center gap-1 ml-auto justify-end mt-1 shrink-0 ${ownMessage ? "text-[var(--text-on-accent)]/60" : "text-[var(--text-secondary)]"}`}>
            <span>{
              message.createdAt
                ? new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : ""
            }</span>
            {ownMessage && (
              <BsCheckAll className={`text-sm ${isRead ? "text-current" : "opacity-60"}`} />
            )}
          </div>
        )}
      </motion.div>

      {/* Long Press Menu - Top Left */}
      {
        activeMessageId === message._id && ownMessage && (
          <div className={`absolute top-0 right-10 mt-0 z-30 bg-[var(--card-bg)] border border-[var(--border)] rounded-lg shadow-xl overflow-hidden min-w-[120px] flex flex-col`}>
            <button
              onClick={(e) => { e.stopPropagation(); deleteHandler(message._id, "unsend"); setActiveMessageId(null); }}
              className="px-4 py-2 text-left text-sm text-red-400 hover:bg-[var(--bg-secondary)] border-b border-[var(--border)]"
            >
              Unsend
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteHandler(message._id, "delete"); setActiveMessageId(null); }}
              className="px-4 py-2 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Delete for me
            </button>
          </div>
        )
      }
    </div >
  );
};

export default React.memo(Message);
