import React, { useState, useEffect, useRef } from "react";
import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { BsCheckAll } from "react-icons/bs";
import { Link, useNavigate } from "react-router-dom";
import { FaReply } from "react-icons/fa";
import { UserData } from "../../context/UserContext";
import axios from "axios";
import { toast } from "react-hot-toast";

const ReactionPicker = ({ onSelect, onClose }) => {
  const emojis = ["❤️", "😂", "😮", "😢", "👍"];

  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05,
        delayChildren: 0.05,
        type: "spring",
        damping: 20,
        stiffness: 500
      }
    },
    exit: {
      opacity: 0,
      transition: { duration: 0.1 }
    }
  };

  const item = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        duration: 0.1
      }
    }
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      exit="exit"
      className="absolute bottom-full mb-6 left-0 right-0 mx-auto w-fit bg-[var(--card-bg)] border border-[var(--border)] rounded-full px-3 py-1.5 shadow-2xl flex gap-3 z-[150] backdrop-blur-xl"
    >
      {emojis.map((emoji) => (
        <motion.button
          key={emoji}
          variants={item}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(emoji);
          }}
          whileHover={{ scale: 1.3 }}
          whileTap={{ scale: 0.9 }}
          className="text-2xl transition-transform cursor-pointer"
        >
          {emoji}
        </motion.button>
      ))}
    </motion.div>
  );
};

const Message = ({ ownMessage, message, isRead, deleteHandler, activeMessageId, setActiveMessageId, onReply, scrollToMessage, highlightedMessageId }) => {
  const { user } = UserData();
  const navigate = useNavigate();
  const longPressTimer = useRef(null);
  const lastTap = useRef(0);
  const tapTimeout = useRef(null);
  const [showReactions, setShowReactions] = useState(false);
  const x = useMotionValue(0);

  // Transform x into opacity and scale for the reply indicator
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

  const isMediaOnly = message.sharedContent && (message.sharedContent.type === 'post' || message.sharedContent.type === 'reel') && !message.text;

  const handleTap = (e, url = null) => {
    e.stopPropagation();
    e.preventDefault();

    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTap.current < DOUBLE_TAP_DELAY) {
      // Double Tap Detected
      if (tapTimeout.current) clearTimeout(tapTimeout.current);

      if (window.navigator?.vibrate) {
        window.navigator.vibrate(10);
      }
      setShowReactions(true);
      lastTap.current = 0; // Reset
    } else {
      // Single Tap Logic
      lastTap.current = now;

      if (url) {
        // Delay navigation for possible second tap
        tapTimeout.current = setTimeout(() => {
          navigate(url);
        }, DOUBLE_TAP_DELAY);
      }
    }
  };

  const handleReactionSelect = async (emoji) => {
    try {
      if (window.navigator?.vibrate) {
        window.navigator.vibrate(5);
      }
      await axios.post(`/api/messages/react/${message._id}`, { emoji });
      setShowReactions(false);
    } catch (error) {
      toast.error("Failed to react");
    }
  };

  const getSharedContentUrl = () => {
    if (!message.sharedContent) return null;
    const { type, contentId } = message.sharedContent;
    if (type === 'profile') return `/user/${contentId}`;
    if (type === 'reel') return `/reels`;
    return `/post/${contentId}`;
  };

  return (
    <div
      id={`msg-${message._id}`}
      className={`flex mb-2 ${ownMessage ? "justify-end" : "justify-start"} relative select-none group`}
    >
      {/* Reaction Picker Overlay */}
      <AnimatePresence>
        {showReactions && (
          <>
            <div
              className="fixed inset-0 z-40"
              onClick={(e) => {
                e.stopPropagation();
                setShowReactions(false);
              }}
            />
            <ReactionPicker
              onSelect={handleReactionSelect}
              onClose={() => setShowReactions(false)}
            />
          </>
        )}
      </AnimatePresence>

      {/* Fixed Reply Indicator */}
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
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        whileTap={{ scale: 0.98 }}
        style={{ x }}
        transition={{ type: "spring", damping: 18, stiffness: 400 }}
        onClick={(e) => handleTap(e)}
        onMouseDown={handleTouchStart}
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
        className={`max-w-[82%] sm:max-w-[85%] break-words relative cursor-pointer flex flex-col transition-opacity duration-200 z-10 ${message.status === "sending" ? "opacity-70 pointer-events-none" : "opacity-100"
          } ${highlightedMessageId === message._id ? 'highlight-message' : ''} ${isMediaOnly
            ? "p-0 bg-transparent shadow-none"
            : `px-3 py-1.5 sm:px-4 sm:py-2 text-[14px] sm:text-base rounded-2xl shadow-sm ${ownMessage
              ? "bg-[var(--accent)] text-[var(--text-on-accent)] rounded-br-sm"
              : "bg-[var(--bg-secondary)] text-[var(--text-primary)] rounded-bl-sm border border-[var(--border)]"}`}
          }`}
      >
        {/* Replying To Preview */}
        {message.replyTo && (
          <div
            onClick={(e) => {
              e.stopPropagation();
              scrollToMessage(message.replyTo._id);
            }}
            className={`mb-2 p-2 rounded-lg text-[11px] border-l-4 overflow-hidden cursor-pointer hover:opacity-80 transition-opacity ${ownMessage
              ? "bg-black/10 border-[var(--text-on-accent)]/40 text-[var(--text-on-accent)]/80"
              : "bg-[var(--bg-primary)] border-[var(--accent)] text-[var(--text-secondary)]"
              }`}>
            <p className="font-bold mb-0.5">
              Replying to {message.replyTo.sender?.username === user?.username ? "you" : `@${message.replyTo.sender?.username}`}
            </p>
            <p className="line-clamp-1 italic text-[10px]">
              {message.replyTo.text || (message.replyTo.sharedContent ? "Shared content" : "Attachment")}
            </p>
          </div>
        )}

        {message.sharedContent && (
          <div className="w-full relative">
            <div
              onClick={(e) => handleTap(e, getSharedContentUrl())}
              className={`block overflow-hidden transition-all pointer-events-auto ${message.sharedContent.type === 'profile' ? 'mb-1 rounded-xl border border-[var(--border)]/30 p-2 bg-[var(--bg-primary)]/10' : 'rounded-lg'
                }`}
            >
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

                  <div className="absolute bottom-1 right-2 flex items-center gap-1 text-[10px] text-white/90 drop-shadow-md font-medium">
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
                <div className="flex items-center gap-3 py-1 w-56 sm:w-80 pr-16 relative group">
                  <div className="w-10 h-10 shrink-0">
                    <img
                      src={message.sharedContent.preview?.image || "/default-avatar.png"}
                      alt="Profile"
                      className="w-full h-full rounded-full object-cover border border-[var(--border)]/30"
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
            </div>
          </div>
        )}

        {message.text && (
          <div className="w-full py-0.5">
            <span className="break-words max-w-full leading-relaxed block">{message.text}</span>
          </div>
        )}

        {!isMediaOnly && message.sharedContent?.type !== 'post' && message.sharedContent?.type !== 'reel' && message.sharedContent?.type !== 'profile' && (
          <div className={`text-[9px] flex items-center gap-1 ml-auto justify-end mt-1 shrink-0 ${ownMessage ? "text-[var(--text-on-accent)]/70" : "text-[var(--text-secondary)]"}`}>
            <span>{
              message.createdAt
                ? new Date(message.createdAt).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                : ""
            }</span>
            {ownMessage && (
              <BsCheckAll className={`text-sm ${isRead ? "text-current" : "opacity-70"}`} />
            )}
          </div>
        )}

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <motion.div
            initial={{ scale: 0.5, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className={`absolute -bottom-3 left-0 flex -space-x-1 items-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-full px-1.5 py-0.5 shadow-md z-20 backdrop-blur-sm`}
          >
            {Array.from(new Set(message.reactions.map((r) => r.emoji))).map((emoji) => (
              <span key={emoji} className="text-sm drop-shadow-sm">
                {emoji}
              </span>
            ))}
            {message.reactions.length > 1 && (
              <span className="text-[10px] ml-1 font-bold text-[var(--text-primary)]">
                {message.reactions.length}
              </span>
            )}
          </motion.div>
        )}
      </motion.div>

      {/* Long Press Menu */}
      <AnimatePresence>
        {activeMessageId === message._id && ownMessage && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 10 }}
            className={`absolute top-0 right-10 z-30 bg-[var(--card-bg)] border border-[var(--border)] rounded-xl shadow-2xl overflow-hidden min-w-[140px] flex flex-col backdrop-blur-lg`}
          >
            <button
              onClick={(e) => { e.stopPropagation(); deleteHandler(message._id, "unsend"); setActiveMessageId(null); }}
              className="px-4 py-2.5 text-left text-sm text-[var(--danger)] font-medium hover:bg-[var(--danger)]/10 border-b border-[var(--border)]"
            >
              Unsend
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); deleteHandler(message._id, "delete"); setActiveMessageId(null); }}
              className="px-4 py-2.5 text-left text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            >
              Delete for me
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default React.memo(Message);
