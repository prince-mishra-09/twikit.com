import React, { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { BsChatFill, BsThreeDotsVertical, BsBookmark, BsBookmarkFill } from "react-icons/bs";
import { IoHeartOutline, IoHeartSharp } from "react-icons/io5";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import { SocketData } from "../context/SocketContext";
import StoryAvatar from "./StoryAvatar";


const PostCard = ({ value, type, isActive, commentId }) => {
  const { user, followUser, savePost, hidePost, muteUser, blockUser } = UserData();
  const { likePost, addComment, deletePost, deleteComment } = PostData();

  const [isLike, setIsLike] = useState(false);
  const [show, setShow] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [isSaved, setIsSaved] = useState(false);

  // Menu State
  const [showMenu, setShowMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false); // Optimistic filtering

  // Comment Delete State
  const [deleteModal, setDeleteModal] = useState({ show: false, commentId: null });
  const longPressTimer = useRef(null);
  const captionLimit = 40; // Characters to show before truncating
  const [isFollowed, setIsFollowed] = useState(false);

  // ... useEffects for Follow / Like / Scroll match existing ...

  useEffect(() => {
    if (user && value.owner) {
      setIsFollowed(user.followings?.includes(value.owner._id));
    }
  }, [user, value.owner]);

  // DEEP LINK COMMENT SCROLL
  // DEEP LINK COMMENT SCROLL
  const hasOpenedComment = useRef(false);

  // Reset ref when commentId changes
  useEffect(() => {
    hasOpenedComment.current = false;
  }, [commentId]);

  useEffect(() => {
    if (commentId) {
      if (!show && !hasOpenedComment.current) {
        setShow(true);
        hasOpenedComment.current = true;
      }

      if (show) {
        setTimeout(() => {
          const element = document.getElementById(`comment-${commentId}`);
          if (element) {
            element.scrollIntoView({ behavior: "smooth", block: "center" });
            element.classList.add("bg-white/10");
            setTimeout(() => element.classList.remove("bg-white/10"), 2000);
          }
        }, 500);
      }
    }
  }, [commentId, show]);

  // Ensure menu closes when clicking outside
  useEffect(() => {
    const closeMenu = () => setShowMenu(false);
    if (showMenu) window.addEventListener("click", closeMenu);
    return () => window.removeEventListener("click", closeMenu);
  }, [showMenu]);


  // ... Existing useEffects ... 
  // Disable body scroll when image viewer OR comments drawer is open
  useEffect(() => {
    if (showImage || show) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [showImage, show]);

  const commentsRef = useRef(null);
  // Auto-scroll to top of comments when drawer opens or new comment added
  useEffect(() => {
    if (show && commentsRef.current) {
      commentsRef.current.scrollTop = 0;
    }
  }, [show, value.comments]);

  // ... Reel States ...
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [showHeart, setShowHeart] = useState(false);



  const formatDate = value.createdAt ? format(new Date(value.createdAt), "MMMM do") : "Unknown Date";

  useEffect(() => {
    // Check if post is like
    if (value.likes && user && value.likes?.includes(user._id)) setIsLike(true);
    else setIsLike(false);
  }, [value, user._id]);

  useEffect(() => {
    if (user && value.owner) {
      setIsFollowed(user.followings?.includes(value.owner._id));
      setIsSaved(user.savedPosts?.includes(value._id));
    }
  }, [user, value.owner, value._id]);

  // ... Reel Autoplay Effect (same as original) ...
  useEffect(() => {
    if (type === "reel" && videoRef.current) {
      if (isActive) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true)).catch((e) => console.log("play blocked", e));
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, type]);


  const likeHandler = () => {
    setIsLike(!isLike);
    likePost(value._id);
  };

  const handleDoubleClick = () => {
    if (!isLike) likeHandler();
    setShowHeart(true);
    setTimeout(() => setShowHeart(false), 700);
  };

  const addCommentHandler = (e) => {
    e.preventDefault();
    addComment(value._id, comment, setComment, setShow);
  };

  const deleteHandler = () => deletePost(value._id);

  const followHandler = async () => {
    setIsFollowed(!isFollowed);
    await followUser(value.owner._id);
  };

  const saveHandler = async () => {
    setIsSaved(!isSaved);
    await savePost(value._id);
  };

  // --- FEED CONTROLS ---
  const notInterestedHandler = async (e) => {
    e.stopPropagation();
    setIsHidden(true); // Optimistic UI
    await hidePost(value._id);
  };

  const muteHandler = async (e) => {
    e.stopPropagation();
    setIsHidden(true); // Optimistic UI
    await muteUser(value.owner._id);
  };

  const { onlineUsers } = SocketData();

  if (!value || isHidden) return null; // Hide post if isHidden is true

  // ===================== REEL RENDER =====================
  if (type === "reel") {
    return (
      <div className="w-full h-full relative group">
        {/* PAUSE OVERLAY */}
        {!isPlaying && (
          <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/20 pointer-events-none">
            <div className="bg-black/40 p-4 rounded-full backdrop-blur-sm">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
                <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        )}

        {/* VIDEO */}
        <div onClick={() => {
          if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
          else { videoRef.current.play(); setIsPlaying(true); }
        }} onDoubleClick={handleDoubleClick} className="w-full h-full cursor-pointer">
          <video
            ref={videoRef}
            src={value.post.url}
            className="w-full h-full object-cover"
            loop
            playsInline
            muted={false}
            onTimeUpdate={() => {
              if (videoRef.current) {
                const current = videoRef.current.currentTime;
                const duration = videoRef.current.duration;
                if (duration > 0) setProgress((current / duration) * 100);
              }
            }}
          />
        </div>

        {/* BOTTOM PROGRESS BAR */}
        <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-800/40 z-30">
          <div
            className="h-full bg-indigo-500 transition-all duration-100 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* RIGHT SIDE ACTIONS */}
        <div className="absolute bottom-16 right-4 flex flex-col gap-6 items-center z-30">
          {/* LIKE */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={likeHandler} className="text-3xl drop-shadow-lg transition-transform active:scale-95">
              {isLike ? <IoHeartSharp className="text-red-500" /> : <IoHeartOutline className="text-white" />}
            </button>
            <span className="text-white text-xs font-medium drop-shadow-md">{value.likes.length}</span>
          </div>

          {/* COMMENT */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={() => setShow(!show)} className="text-3xl text-white drop-shadow-lg transition-transform active:scale-95">
              <BsChatFill />
            </button>
            <span className="text-white text-xs font-medium drop-shadow-md">{value.comments.length}</span>
          </div>

          {/* SAVE */}
          <div className="flex flex-col items-center gap-1">
            <button onClick={saveHandler} className="text-3xl drop-shadow-lg transition-transform active:scale-95">
              {isSaved ? <BsBookmarkFill className="text-white" /> : <BsBookmark className="text-white" />}
            </button>
          </div>

          {/* DELETE (if owner) */}
          {user && value.owner._id === user._id && (
            <button onClick={deleteHandler} className="text-white text-2xl drop-shadow-lg opacity-80 hover:opacity-100">
              <MdDelete />
            </button>
          )}

          {/* MENU (if NOT owner) */}
          {user && value.owner._id !== user._id && (
            <div className="relative">
              <button
                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                className="text-white text-2xl drop-shadow-lg opacity-80 hover:opacity-100 p-1"
              >
                <BsThreeDotsVertical />
              </button>
              {showMenu && (
                <div className="absolute right-0 bottom-full mb-2 w-40 bg-[#1F2937] rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[100] animate-in slide-in-from-bottom-2 fade-in duration-200">
                  <button
                    onClick={notInterestedHandler}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                  >
                    ❌ Not Interested
                  </button>
                  <button
                    onClick={muteHandler}
                    className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2 border-t border-white/5"
                  >
                    🔇 Mute @{value.owner.name}
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Block this user? They will disappear from your feed.")) {
                        blockUser(value.owner._id, null);
                        setIsHidden(true);
                      }
                      setShowMenu(false);
                    }}
                    className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-white/10 flex items-center gap-2 border-t border-white/5"
                  >
                    🚫 Block User
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* BOTTOM LEFT INFO */}
        <div className="absolute bottom-6 left-4 right-16 z-30 text-white pointer-events-none">
          <div className="flex items-center gap-3 mb-3 pointer-events-auto">
            <Link to={`/user/${value.owner._id}`} className="flex items-center gap-2">
              <img src={value.owner?.profilePic?.url} className="w-9 h-9 rounded-full border border-white/20" alt="" />
              <span className="font-semibold text-sm shadow-black drop-shadow-md">{value.owner.name}</span>
            </Link>

            {/* FOLLOW BUTTON */}
            {user && user._id !== value.owner._id && (
              <button
                onClick={followHandler}
                className={`text-xs px-3 py-1 rounded-lg backdrop-blur-md transition border ${isFollowed
                  ? "bg-white/10 border-white/30 text-white"
                  : "bg-indigo-600/80 border-indigo-500/50 text-white hover:bg-indigo-500"
                  }`}
              >
                {isFollowed ? "Following" : "Follow"}
              </button>
            )}
          </div>
          {value.caption && (
            <div className="pointer-events-auto">
              <p className="text-sm text-gray-100 drop-shadow-md break-words">
                {expanded ? value.caption : (value.caption.slice(0, captionLimit) + (value.caption.length > captionLimit ? "..." : ""))}
                {value.caption.length > captionLimit && (
                  <button onClick={() => setExpanded(!expanded)} className="text-gray-300 ml-1 hover:text-white font-semibold">
                    {expanded ? "less" : "more"}
                  </button>
                )}
              </p>
            </div>
          )}
        </div>

        {/* COMMENTS MODAL / OVERLAY (Simplified for Reel) */}
        {show && (
          <div className="absolute bottom-0 left-0 w-full bg-black/95 backdrop-blur-md p-4 rounded-t-2xl z-40 max-h-[70vh] flex flex-col transition-transform animate-in slide-in-from-bottom border-t border-white/10">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-white font-bold">Comments</h3>
              <button onClick={() => setShow(false)} className="text-gray-400 p-1 hover:text-white">✕</button>
            </div>
            <div className="flex-1 overflow-y-auto mb-4 custom-scrollbar flex flex-col gap-3">
              {value.comments && value.comments.length > 0 ? (
                value.comments.map((c, i) => (
                  <div key={i} className="flex gap-2 items-start text-white">
                    <StoryAvatar
                      user={{ _id: c.user, name: c.name, profilePic: c.profilePic }}
                      size="w-8 h-8"
                    />
                    <div className="text-sm bg-white/5 p-2 rounded-lg rounded-tl-none">
                      <span className="font-bold text-gray-300 mr-2 block text-xs mb-1">{c.name}</span>
                      {c.comment}
                    </div>
                  </div>
                ))
              ) : (
                <p className="text-gray-500 text-sm text-center">Be the first to comment</p>
              )}
            </div>
            <form onSubmit={addCommentHandler} className="flex gap-2">
              <input
                type="text"
                className="flex-1 px-4 py-2.5 rounded-full bg-white/10 text-white focus:outline-none placeholder:text-gray-500 text-sm border border-transparent focus:border-indigo-500/50"
                placeholder="Add a comment..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
              />
              <button type="submit" className="text-indigo-400 font-semibold text-sm px-2 hover:text-indigo-300">Post</button>
            </form>
          </div>
        )}
      </div>
    );
  }

  const formatCommentDate = (dateString) => {
    if (!dateString) return "just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };

  // ===================== POST RENDER =====================
  return (
    <div className="bg-[#0B0F14] w-full border-b border-white/10 pb-4">
      {/* ===== POST IMAGE & OVERLAY HEADER ===== */}
      <div className="relative w-full group">
        {/* Header Overlay */}
        <div className="absolute top-0 left-0 w-full p-4 flex justify-between items-start z-10 bg-gradient-to-b from-black/60 to-transparent pointer-events-none">
          <Link
            to={`/user/${value.owner._id}`}
            className="flex items-center gap-3 pointer-events-auto"
          >
            <div className="relative">
              <StoryAvatar user={value.owner} />
              {onlineUsers?.includes(value.owner._id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black z-10" />
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-white font-bold text-sm shadow-black drop-shadow-md">
                {value.owner.name}
              </p>
              <p className="text-gray-200 text-[10px] drop-shadow-md">{formatDate}</p>
            </div>
          </Link>

          {/* Delete / Follow / Menu Button Overlay */}
          <div className="pointer-events-auto flex items-center gap-2">
            {user && value.owner._id === user._id ? (
              <button
                onClick={deleteHandler}
                className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80 hover:text-red-500 hover:bg-black/60 transition-all"
              >
                <MdDelete className="text-lg" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={followHandler}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md transition-all shadow-lg ${isFollowed
                    ? "bg-white/20 text-white border border-white/20"
                    : "bg-indigo-600/90 text-white hover:bg-indigo-500"
                    }`}
                >
                  {isFollowed ? "Following" : "Follow"}
                </button>

                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="bg-black/40 backdrop-blur-md p-2 rounded-full text-white/80 hover:text-white hover:bg-black/60 transition-all"
                  >
                    <BsThreeDotsVertical className="text-sm" />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-[#1F2937]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                      <button
                        onClick={notInterestedHandler}
                        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2"
                      >
                        ❌ Not Interested
                      </button>
                      <button
                        onClick={muteHandler}
                        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center gap-2 border-t border-white/5"
                      >
                        🔇 Mute @{value.owner.name}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Block this user? They will disappear from your feed.")) {
                            blockUser(value.owner._id, null);
                            setIsHidden(true);
                          }
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-white/10 flex items-center gap-2 border-t border-white/5"
                      >
                        🚫 Block User
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* The Image */}
        <img
          src={value.post.url}
          alt=""
          onClick={() => setShowImage(true)}
          className="w-full h-auto object-cover cursor-pointer active:opacity-95 transition-opacity min-h-[300px]"
        />
      </div>

      {/* FULL SCREEN IMAGE VIEWER VIA PORTAL */}
      {showImage && createPortal(
        <div
          className="fixed inset-0 z-[9999] bg-black flex items-center justify-center p-0 animate-in fade-in duration-200"
          onClick={() => setShowImage(false)}
        >
          <button
            onClick={() => setShowImage(false)}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-4xl z-[10000] p-2"
          >
            &times;
          </button>
          <img
            src={value.post.url}
            alt=""
            className="max-w-screen max-h-screen object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>,
        document.body
      )}

      {/* ===== ACTIONS & CAPTION ===== */}
      <div className="px-3 pt-3">
        {/* Action Row: Likes & Comments inline */}
        <div className="flex items-center gap-6 mb-3">
          {/* Like Group */}
          <div className="flex items-center gap-2">
            <button
              onClick={likeHandler}
              className="text-2xl transition-transform active:scale-75"
            >
              {isLike ? <IoHeartSharp className="text-red-500" /> : <IoHeartOutline className="text-white" />}
            </button>
            <span className="text-white font-semibold text-sm">{value.likes.length}</span>
          </div>

          {/* Comment Group */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShow(!show)}
              className="text-2xl transition-transform active:scale-75"
            >
              <BsChatFill className="text-white" />
            </button>
            <span className="text-white font-semibold text-sm">{value.comments.length}</span>
          </div>

          {/* Bookmark Group */}
          <div className="flex items-center gap-2 ml-auto">
            <button
              onClick={saveHandler}
              className="text-2xl transition-transform active:scale-75"
            >
              {isSaved ? <BsBookmarkFill className="text-white" /> : <BsBookmark className="text-white" />}
            </button>
          </div>
        </div>

        {/* Caption */}
        {value.caption && (
          <div className="text-white text-sm mb-2">
            <span className="font-bold mr-2">{value.owner.name}</span>
            <span className="text-gray-200">
              {expanded ? value.caption : (value.caption.slice(0, captionLimit) + (value.caption.length > captionLimit ? "..." : ""))}
            </span>
            {value.caption.length > captionLimit && (
              <button onClick={() => setExpanded(!expanded)} className="text-gray-400 text-xs ml-1 hover:text-white">
                {expanded ? "less" : "more"}
              </button>
            )}
          </div>
        )}

        {/* View Comments Link */}
        {value.comments.length > 0 && (
          <button
            onClick={() => setShow(!show)}
            className="text-gray-500 text-xs font-medium"
          >
            View all {value.comments.length} comments
          </button>
        )}
      </div>

      {/* ===== COMMENTS DRAWER VIA PORTAL ===== */}
      {show && createPortal(
        <div className="fixed inset-0 z-[9999] flex justify-center items-end" role="dialog">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
            onClick={() => setShow(false)}
          />

          {/* Drawer */}
          <div className="relative w-full max-w-md bg-[#1F2937] rounded-t-3xl h-[60vh] md:h-[75vh] flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300">
            {/* Drawer Handle */}
            <div className="w-full flex justify-center pt-3 pb-1" onClick={() => setShow(false)}>
              <div className="w-12 h-1.5 bg-gray-600 rounded-full" />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center px-4 py-2 border-b border-gray-700">
              <h3 className="text-white font-bold text-lg">Comments</h3>
              <button onClick={() => setShow(false)} className="p-2 text-gray-400 hover:text-white">
                ✕
              </button>
            </div>

            {/* Comments List */}
            <div ref={commentsRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-4 custom-scrollbar relative">
              {value.comments && value.comments.length > 0 ? (
                // Assuming backend sends them sorted.
                // We reverse locally?
                // BE CAREFUL: commentId scroll needs to match the rendered order.
                // Original code: [...value.comments].reverse().map
                [...value.comments].reverse().map((c, i) => (
                  <div
                    key={i}
                    id={`comment-${c._id}`}
                    className={`flex gap-3 items-start animate-in slide-in-from-bottom fade-in duration-300 p-2 rounded-lg transition-colors ${commentId === c._id ? "bg-white/10 border border-indigo-500/30" : ""
                      }`}
                  >
                    <Link to={`/user/${c.user?._id}`} className="shrink-0">
                      <StoryAvatar
                        user={c.user}
                        size="w-8 h-8"
                      />
                    </Link>
                    <div className="flex flex-col flex-1">
                      <div className="flex items-baseline justify-between w-full">
                        <div className="flex items-baseline gap-2">
                          <Link to={`/user/${c.user?._id}`}>
                            <span className="text-sm font-semibold text-white hover:underline">{c.name}</span>
                          </Link>
                          <span className="text-xs text-gray-400">
                            {formatCommentDate(c.createdAt)}
                          </span>
                        </div>

                        {(user?._id === c.user?._id || user?._id === value.owner._id) && (
                          <button
                            onClick={() => setDeleteModal({ show: true, commentId: c._id })}
                            className="text-gray-400 hover:text-white p-1"
                          >
                            <BsThreeDotsVertical className="text-sm" />
                          </button>
                        )}
                      </div>
                      <p className="text-sm text-gray-200 mt-0.5 leading-tight">{c.comment}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                  <BsChatFill className="text-4xl opacity-20" />
                  <p>No comments yet.</p>
                  <p className="text-xs">Start the conversation.</p>
                </div>
              )}

              {/* DELETE CONFIRMATION MODAL (Nested inside Comment Drawer) */}
              {deleteModal.show && (
                <div className="absolute inset-x-0 bottom-0 bg-[#2D3748] p-4 rounded-t-2xl shadow-xl z-50 animate-in slide-in-from-bottom border-t border-white/10">
                  <p className="text-white text-center mb-4 font-semibold">Delete this comment?</p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => setDeleteModal({ show: false, commentId: null })}
                      className="flex-1 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-500"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        deleteComment(value._id, deleteModal.commentId);
                        setDeleteModal({ show: false, commentId: null });
                      }}
                      className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium hover:bg-red-500"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area - Fixed at bottom of drawer */}
            <div className="p-4 border-t border-gray-700 bg-[#1F2937] rounded-b-none lg:rounded-b-3xl pb-6 md:pb-4">
              {/* Emoji Bar */}
              <div className="flex justify-between mb-3 px-2">
                {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😂"].map((emoji) => (
                  <button
                    key={emoji}
                    type="button"
                    onClick={() => setComment((prev) => prev + emoji)}
                    className="text-2xl hover:scale-125 transition-transform"
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  // Pass empty function as setShow to prevent closing drawer
                  addComment(value._id, comment, setComment, () => { });
                }}
                className="flex gap-3 items-center"
              >
                <img
                  src={user.profilePic?.url}
                  className="w-8 h-8 rounded-full border border-gray-600"
                  alt=""
                />
                <div className="flex-1 relative">
                  <input
                    type="text"
                    className="w-full bg-gray-800 text-white text-sm rounded-full px-4 py-2.5 focus:outline-none focus:ring-1 focus:ring-indigo-500 border border-transparent placeholder:text-gray-500"
                    placeholder={`Comment as ${user?.name}...`}
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={!comment.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-indigo-400 font-semibold text-sm hover:text-indigo-300 disabled:opacity-50 px-2"
                  >
                    Post
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default PostCard;
