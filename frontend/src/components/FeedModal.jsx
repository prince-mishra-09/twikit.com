import React, { useEffect, useRef, useState } from "react";
import { IoArrowBack } from "react-icons/io5";
import PostCard from "./PostCard";

/**
 * FeedModal - A centralized component to show posts in a feed view.
 * @param {Array} posts - List of posts to display.
 * @param {Number} initialIndex - The index of the post to scroll to on mount.
 * @param {Function} onClose - Function to close the modal.
 * @param {Function} onUpdate - Callback for post updates (likes, saves, etc.).
 */
const FeedModal = ({ posts, initialIndex, onClose, onUpdate }) => {
  const modalRef = useRef(null);
  
  // Disable body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  useEffect(() => {
    // Scroll to the initial post on mount
    if (modalRef.current) {
      setTimeout(() => {
        const element = document.getElementById(`feed-post-${initialIndex}`);
        if (element) {
          element.scrollIntoView({ behavior: "auto", block: "start" });
        }
      }, 100);
    }
  }, [initialIndex]);

  return (
    <div className="fixed inset-0 z-[100] bg-[var(--overlay)] flex flex-col items-center overflow-hidden">
      {/* Header with Back Button */}
      <div className="w-full z-[110] px-4 py-3 flex items-center bg-[var(--bg-primary)]/80 backdrop-blur-md border-b border-[var(--border)]/20">
        <button
          onClick={onClose}
          className="flex items-center gap-2 text-white hover:text-[var(--accent)] transition-all duration-200 group p-2 rounded-full hover:bg-white/10"
        >
          <IoArrowBack className="text-2xl group-active:scale-90 transition-transform" />
          <span className="font-semibold text-sm">Back</span>
        </button>
      </div>

      {/* Scrollable Content Area */}
      <div className="w-full overflow-y-auto custom-scrollbar flex flex-col items-center flex-1">
        <div 
          className="w-full max-w-[550px] pt-0 pb-20 px-2 sm:px-0" 
          ref={modalRef}
        >
          {posts.map((post, index) => (
            <div
              key={post._id}
              id={`feed-post-${index}`}
              className={`mb-8 last:mb-20 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4 zoom-in-95 fill-mode-both`}
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div className={`${post.type === 'reel' ? 'max-w-[400px] mx-auto' : 'w-full'}`}>
                 <PostCard 
                   type={post.type || "post"} 
                   value={post} 
                   onUpdate={onUpdate}
                   isFeed={true} // Highlighting it's in a feed view
                 />
              </div>
            </div>
          ))}
          
          {/* End of list indicator */}
          <div className="py-12 flex flex-col items-center justify-center opacity-30">
            <div className="h-[1px] w-12 bg-white/30 mb-4" />
            <p className="text-white text-xs font-medium tracking-[0.2em] uppercase">End of Stories</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedModal;
