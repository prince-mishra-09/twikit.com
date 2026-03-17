import React, { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import { createPortal } from "react-dom";
import { toast } from "react-hot-toast";
import { BsChatFill, BsThreeDotsVertical, BsBookmark, BsBookmarkFill, BsPencil } from "react-icons/bs";
import { IoPaperPlaneOutline, IoEyeOutline, IoClose } from "react-icons/io5";

import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { format } from "date-fns";
import { Link, useNavigate } from "react-router-dom";
import { MdDelete } from "react-icons/md";
import { SocketData } from "../context/SocketContext";
import StoryAvatar from "./StoryAvatar";
import ReelsIcon from "./ReelsIcon";
import { Suspense } from "react";
import { getOptimizedImg } from "../utils/imagekit";
import { isSameId, includesId } from "../utils/idUtils";

const CommentItem = React.lazy(() => import("./CommentItem"));
const ShareModal = React.lazy(() => import("./ShareModal"));
const VibeModal = React.lazy(() => import("./VibeModal"));
const ConfirmationModal = React.lazy(() => import("./ConfirmationModal"));
const EditPostModal = React.lazy(() => import("./EditPostModal"));



// --- Custom Icons ---
// --- Custom Icons ---
const VibeUpIcon = ({ active }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "var(--accent)" : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-colors duration-200 ${active ? "fill-[var(--accent)]" : ""}`}
  >
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" />
  </svg>
);

const VibeDownIcon = ({ active }) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke={active ? "var(--warning)" : "currentColor"}
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={`transition-all duration-200 ${active ? "fill-[var(--warning)] opacity-100" : "opacity-80"}`}
  >
    <path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.31 2H17" />
  </svg>
);

const PostCard = ({ 
  value, 
  type, 
  isActive, 
  commentId, 
  openComments, 
  isGrid, 
  isFeed, 
  onClick, 
  onUpdate,
  showViews = false,
  showIcon = true
}) => {
  const { user, isAuth, setShowLoginPrompt, followUser, savePost, hidePost, muteUser, blockUser } = UserData();
  const { sendFeedback, addComment, deletePost, deleteComment } = PostData();
  const navigate = useNavigate();

  const [isVibeUp, setIsVibeUp] = useState(() => includesId(value.vibesUp, user?._id));
  const [vibeUpCount, setVibeUpCount] = useState(value.vibesUp?.length || 0);
  const [isVibeDown, setIsVibeDown] = useState(() => includesId(value.vibesDown, user?._id));
  const [vibeDownCount, setVibeDownCount] = useState(value.vibesDown?.length || 0);
  const isOwner = isSameId(value.owner?._id, user?._id);
  const [show, setShow] = useState(false);
  const [showImage, setShowImage] = useState(false);
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);


  // ... (previous imports)

  // Menu State
  const [showMenu, setShowMenu] = useState(false);
  const [isHidden, setIsHidden] = useState(false); // Optimistic filtering

  // Comment Delete Menu State (Lifted from CommentItem)
  const [activeCommentMenuId, setActiveCommentMenuId] = useState(null);

  // Comment Delete State (Confirmation Modal - keep existing or unify? User asked for 3-dot menu fix)
  // The user said "har comment me agar daba de toh sabla delete cancel dikhata h... ek baar me ek ka dikhe"
  // This refers to the small popup in CommentItem. 
  // We will control that via activeCommentMenuId.

  const [deleteModal, setDeleteModal] = useState({ show: false, commentId: null });
  const longPressTimer = useRef(null);
  const captionLimit = 40; // Characters to show before truncating
  // Initialize state from props/context directly to avoid flicker
  const [isFollowed, setIsFollowed] = useState(() => includesId(user?.followings, value.owner?._id));

  const [isSaved, setIsSaved] = useState(() => includesId(user?.savedPosts, value._id));
  const [savesCount, setSavesCount] = useState(value.savesCount || 0);
  const [sharesCount, setSharesCount] = useState(value.sharesCount || 0);
  const [shareModal, setShareModal] = useState(false);
  const [vibeModal, setVibeModal] = useState(false);
  const [showPostDeleteConfirm, setShowPostDeleteConfirm] = useState(false);
  const [showOwnerMenu, setShowOwnerMenu] = useState(false);
  const [showEditPage, setShowEditPage] = useState(false);
  const feedbackProcessingRef = useRef(false);
  const { updatePost, trackShare, syncPostUpdate } = PostData();

  // 1. Sync Follow/Save status from User Object
  useEffect(() => {
    setIsFollowed(includesId(user?.followings, value.owner?._id));
    setIsSaved(includesId(user?.savedPosts, value._id));
  }, [user, value.owner?._id, value._id]);

  // 2. Sync Counts from Props ONLY when not processing
  useEffect(() => {
    if (!feedbackProcessingRef.current) {
        setSavesCount(value.savesCount || 0);
        setSharesCount(value.sharesCount || 0);
    }
  }, [value.savesCount, value.sharesCount]);

  // New Comment State
  const [comments, setComments] = useState([]);
  const [loadingComments, setLoadingComments] = useState(false);
  const [replyingTo, setReplyingTo] = useState(null); // { id, user }

  // Fetch Comments on Drawer Open
  const fetchComments = async () => {
    // Only fetch if empty or specifically requested? 
    // For now, keep fetching but we will rely on optimistic updates for actions.
    setLoadingComments(true);
    try {
      const { data } = await axios.get("/api/comment/" + value._id);
      setComments(data.comments);
    } catch (error) {
      // console.log(error);
    } finally {
      setLoadingComments(false);
    }
  };

  useEffect(() => {
    if (show) {
      fetchComments();
    }
  }, [show, value._id]);

  // NOTE: Duplicate sync effect removed (Bug #1). Individual effects below handle this.

  // --- Handlers for Optimistic Updates ---

  const handleNewComment = (newComment) => {
    setComments((prev) => [newComment, ...prev]);
  };

  const handleNewReply = (parentId, newReply) => {
    setComments((prev) =>
      prev.map((c) =>
        c._id === parentId
          ? { ...c, replies: [...(c.replies || []), newReply] }
          : c
      )
    );
  };

  const handleDeleteLocal = (commentId, parentId = null) => {
    if (parentId) {
      // Delete reply
      setComments((prev) =>
        prev.map((c) =>
          c._id === parentId
            ? { ...c, replies: c.replies.filter(r => r._id !== commentId) }
            : c
        )
      );
    } else {
      // Delete top-level
      setComments((prev) => prev.filter((c) => c._id !== commentId));
    }
  };

  const toggleCommentMenu = (commentId) => {
    setActiveCommentMenuId(prev => prev === commentId ? null : commentId);
  };

  const formatCommentDate = (dateString) => {
    if (!dateString) return "just now";
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now - date) / 1000);

    if (diffInSeconds < 60) return "just now";
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m`;
    if (diffInSeconds < 84600) return `${Math.floor(diffInSeconds / 3600)}h`;
    if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 84600)}d`;
    return `${Math.floor(diffInSeconds / 604800)}w`;
  };



  const addCommentHandler = async (e) => {
    e.preventDefault();
    if (!isAuth) {
      setShowLoginPrompt(true);
      return;
    }
    if (!comment.trim()) return;

    const commentText = comment;
    const parentId = replyingTo ? replyingTo.id : null;
    setComment(""); // Clear input immediately

    // 1. CREATE OPTIMISTIC COMMENT
    const tempId = "temp_" + Date.now();
    const optimisticComment = {
      _id: tempId,
      comment: commentText,
      user: {
        _id: user._id,
        name: user.name,
        profilePic: user.profilePic,
        username: user.username
      },
      createdAt: new Date().toISOString(),
      replies: [],
      status: "sending"
    };

    // 2. UPDATE UI INSTANTLY
    if (parentId) {
      handleNewReply(parentId, optimisticComment);
    } else {
      handleNewComment(optimisticComment);
    }

    setReplyingTo(null);

    // 3. API CALL
    try {
      const newComment = await addComment(value._id, commentText, () => { }, () => { }, parentId);
      if (newComment) {
        // 4. REPLACE OPTIMISTIC COMMENT WITH REAL ONE
        setComments((prev) =>
          prev.map((c) => {
            if (c._id === tempId) return { ...newComment, replies: [] };
            if (c.replies) {
              return {
                ...c,
                replies: c.replies.map((r) => (r._id === tempId ? newComment : r))
              };
            }
            return c;
          })
        );
      }
    } catch (error) {
      console.error("Failed to add comment:", error);
      toast.error("Failed to add comment");
      // 5. REMOVE OPTIMISTIC COMMENT ON FAILURE
      handleDeleteLocal(tempId, parentId);
    }
  };



  // ... useEffects for Follow / Like / Scroll match existing ...

  // Removed redundant effect that caused unsafe access. Logic is consolidated below.


  // DEEP LINK COMMENT SCROLL
  const hasOpenedComment = useRef(false);

  // Reset ref when commentId changes
  // 1. Open drawer if commentId is present or openComments is true
  useEffect(() => {
    if ((commentId || openComments) && !show && !hasOpenedComment.current) {
      setShow(true);
      hasOpenedComment.current = true; // Fix: Mark as handled so it doesn't re-open on close
    }
    // Clear reply state when drawer closes
    if (!show) setReplyingTo(null);
  }, [commentId, openComments, show]);

  // 2. Scroll to comment once loaded
  useEffect(() => {
    if (commentId && show && comments && comments.length > 0 && !hasOpenedComment.current) {
      // Short timeout to ensure DOM render
      setTimeout(() => {
        const element = document.getElementById(`comment-${commentId}`);
        if (element) {
          element.scrollIntoView({ behavior: "auto", block: "center" });
          element.classList.add("bg-white/10");
          setTimeout(() => element.classList.remove("bg-white/10"), 2000);
          hasOpenedComment.current = true; // Mark as scrolled
        }
      }, 100);
    }
  }, [commentId, show, comments]);

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

  const { socket } = SocketData();

  // JOIN ROOM FOR REAL-TIME UPDATES
  useEffect(() => {
    if (socket && value?._id) {
      socket.emit("join-post", value._id);
      return () => {
        socket.emit("leave-post", value._id);
      };
    }
  }, [socket, value?._id]);

  const commentsRef = useRef(null);
  // Auto-scroll to top of comments when drawer opens or new comment added
  useEffect(() => {
    if (show && commentsRef.current) {
      commentsRef.current.scrollTop = 0;
    }
  }, [show]);

  // ... Reel States ...
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);



  const formatDate = value.createdAt ? format(new Date(value.createdAt), "MMMM do") : "Unknown Date";

  // Separate effects to prevent race conditions/overwrites during partial updates
  useEffect(() => {
    // Only update VibeUp state when vibesUp array changes
    if (value.vibesUp) {
      setIsVibeUp(includesId(value.vibesUp, user?._id));
      setVibeUpCount(value.vibesUp.length);
    }
  }, [value.vibesUp, user?._id]);

  useEffect(() => {
    // Only update VibeDown state when vibesDown array changes
    if (value.vibesDown) {
      setIsVibeDown(includesId(value.vibesDown, user?._id));
      setVibeDownCount(value.vibesDown.length);
    }
  }, [value.vibesDown, user?._id]);

  // UseEffect for follow status removed as it is now handled by the state initialization and the specific sync effect above.

  // View Count Logic
  const [viewTracked, setViewTracked] = useState(false);

  const handleTimeUpdate = () => {
    if (!videoRef.current || viewTracked) return;
    const { currentTime, duration } = videoRef.current;

    // Default duration to avoid NaN. Track if > 5% played
    if (duration > 0 && currentTime / duration > 0.05) {
      setViewTracked(true);
      // Call API to register view
      try {
        axios.post(`/api/post/view/${value._id}`);
      } catch (error) {
        // console.error("Failed to track view", error);
      }
    }
  };





  useEffect(() => {
    if (type === "reel" && videoRef.current) {
      if (isActive) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise.then(() => setIsPlaying(true)).catch((e) => { }); // console.log("play blocked", e));
        }
      } else {
        videoRef.current.pause();
        setIsPlaying(false);
      }
    }
  }, [isActive, type]);

  // Auto-play for Feed Reels using IntersectionObserver
  useEffect(() => {
    if (!isFeed || type !== "reel" || !videoRef.current) return;

    const options = {
      root: null,
      rootMargin: "0px",
      threshold: 0.6, // Play when 60% visible
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!videoRef.current) return;

        if (entry.isIntersecting) {
          const playPromise = videoRef.current.play();
          if (playPromise !== undefined) {
            playPromise.then(() => setIsPlaying(true)).catch(() => { });
          }
        } else {
          videoRef.current.pause();
          setIsPlaying(false);
        }
      });
    }, options);

    observer.observe(videoRef.current);

    return () => {
      observer.disconnect();
    };
  }, [isFeed, type]);





  const feedbackHandler = (feedbackType) => {
    if (!isAuth) {
      setShowLoginPrompt(true);
      return;
    }
    // Bug #6 fix: Prevent rapid clicks from causing race conditions
    if (feedbackProcessingRef.current) return;
    feedbackProcessingRef.current = true;

    // Optimistic UI update with Mutual Exclusivity
    if (feedbackType === "vibeUp") {
      const newState = !isVibeUp;
      setIsVibeUp(newState);
      setVibeUpCount(newState ? vibeUpCount + 1 : vibeUpCount - 1);

      // Mutually Exclusive: If adding VibeUp, remove VibeDown
      if (newState && isVibeDown) {
        setIsVibeDown(false);
        setVibeDownCount(vibeDownCount - 1);
      }
    } else {
      const newState = !isVibeDown;
      setIsVibeDown(newState);
      setVibeDownCount(newState ? vibeDownCount + 1 : vibeDownCount - 1);

      // Mutually Exclusive: If adding VibeDown, remove VibeUp
      if (newState && isVibeUp) {
        setIsVibeUp(false);
        setVibeUpCount(vibeUpCount - 1);
      }
    }

    // Fire and forget (but catch error to revert)
    sendFeedback(value._id, feedbackType).catch((error) => {
      console.error("Feedback error, reverting:", error);
      toast.error("Failed to update. Please try again.");
      // Revert to original state from props if error occurs (Bug #5 fix: use includesId)
      setIsVibeUp(includesId(value.vibesUp, user?._id));
      setVibeUpCount(value.vibesUp?.length || 0);
      setIsVibeDown(includesId(value.vibesDown, user?._id));
      setVibeDownCount(value.vibesDown?.length || 0);
    }).finally(() => {
      feedbackProcessingRef.current = false;
    });
  };

  const handleDoubleClick = () => {
    if (!isVibeUp) feedbackHandler("vibeUp");
  };



  // Delete confirm modal state is handled via inline setters now


  const followHandler = async () => {
    if (!isAuth) {
      setShowLoginPrompt(true);
      return;
    }
    const previousState = isFollowed;
    setIsFollowed(!isFollowed);

    try {
      const message = await followUser(value.owner._id);
      if (!message) {
        // If API returns null or undefined, something went wrong
        setIsFollowed(previousState);
      }
    } catch (error) {
      console.error("Follow error:", error);
      setIsFollowed(previousState);
      toast.error("Failed to update follow status");
    }
  };

  const saveHandler = async (e) => {
    if (e) e.stopPropagation();
    if (!isAuth) {
      setShowLoginPrompt(true);
      return;
    }
    if (feedbackProcessingRef.current) return;
    feedbackProcessingRef.current = true;
    
    // Optimistic UI for save count
    const wasSaved = isSaved;
    const previousCount = savesCount;
    setIsSaved(!wasSaved);
    setSavesCount(prev => wasSaved ? prev - 1 : prev + 1);

    try {
      const data = await savePost(value._id);
      if (data && data.post) {
        // Update GLOBAL state so other cards sync up
        syncPostUpdate(data.post);
        // Update LOCAL Parent list if it exists
        if (onUpdate) onUpdate(data.post);
        // Sync LOCAL state with confirmed backend data
        setSavesCount(data.post.savesCount);
      }
    } catch {
      setIsSaved(wasSaved);
      setSavesCount(previousCount);
      toast.error("Failed to save post");
    } finally {
      feedbackProcessingRef.current = false;
    }
  };

  const shareHandler = async (e) => {
    if (e) e.stopPropagation();
    setShareModal(true);
  };

  const handleShareSuccess = async (count = 1) => {
    if (feedbackProcessingRef.current) return;
    feedbackProcessingRef.current = true;
    
    // Optimistic UI for share count
    const previousSharesCount = sharesCount;
    setSharesCount(prev => (prev || 0) + count);

    try {
      const updatedPost = await trackShare(value._id, count);
      if (updatedPost) {
        // Update local state with truthful count from backend
        setSharesCount(updatedPost.sharesCount);
        // Notify parent list if applicable
        if (onUpdate) onUpdate(updatedPost);
      }
    } catch (error) {
      // Revert on error
      setSharesCount(previousSharesCount);
      console.error("Share sync error:", error);
    } finally {
      feedbackProcessingRef.current = false;
    }
  };

  // --- FEED CONTROLS ---
  const notInterestedHandler = async (e) => {
    e.stopPropagation();
    if (!isAuth) {
      setShowLoginPrompt(true);
      return;
    }
    setIsHidden(true); // Optimistic UI
    await hidePost(value._id);
  };

  const muteHandler = async (e) => {
    e.stopPropagation();
    if (!isAuth) {
      setShowLoginPrompt(true);
      return;
    }
    setIsHidden(true); // Optimistic UI
    await muteUser(value.owner._id);
  };

  const { onlineUsers } = SocketData();

  if (!value || isHidden) return null; // Hide post if isHidden is true

  // --- Rendering logic ---

  // ===================== GRID RENDERS =====================
  
  // ===================== REEL RENDER =====================
  // GRID MODE (For Profile/Search)
  if (type === "reel" && isGrid) {
    return (
      <div className="w-full h-full relative cursor-pointer bg-black flex items-center justify-center group/grid" onClick={onClick}>
        <video
          src={value.post.url}
          className="w-full h-full object-contain"
          muted
          crossOrigin="anonymous"
        />
        {/* Reel Indicator - Top Right (Optional) */}
        {showIcon && (
          <div className="absolute top-2 right-2 text-white drop-shadow-md z-10 opacity-90">
            <ReelsIcon size={18} />
          </div>
        )}

        {/* View Count Indicator - Bottom Left (Optional - for Reel Tab) */}
        {showViews && (
          <div className="absolute bottom-2 left-2 flex items-center gap-1 text-white text-[11px] drop-shadow-md font-bold z-10 drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)]">
            <IoEyeOutline size={14} className="mb-[1px]" />
            <span>{value.views || 0}</span>
          </div>
        )}

        {/* Hover Overlay - Optional but matches standard posts if we want consistency */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/grid:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
          <div className="flex items-center gap-1">
            <VibeUpIcon active={true} />
            <span>{value.vibesUp?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <BsChatFill />
            <span>{value.commentsCount || 0}</span>
          </div>
        </div>
      </div>
    );
  }

  // GRID MODE (For Profile/Search - Standard Posts)
  if (type !== "reel" && isGrid) {
    return (
      <div className="w-full h-full relative cursor-pointer group aspect-square bg-[var(--bg-secondary)]" onClick={onClick}>
        <img
          src={getOptimizedImg(value.post.url, 400)}
          alt=""
          className="w-full h-full object-cover"
          crossOrigin="anonymous"
        />
        {/* Hover Overlay */}
        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4 text-white font-bold">
          <div className="flex items-center gap-1">
            <VibeUpIcon active={true} />
            <span>{value.vibesUp?.length || 0}</span>
          </div>
          <div className="flex items-center gap-1">
            <BsChatFill />
            <span>{value.commentsCount || 0}</span>
          </div>
        </div>
        {value.images && value.images.length > 1 && (
          <div className="absolute top-2 right-2 text-white drop-shadow-md">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 8.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v8.25A2.25 2.25 0 006 16.5h2.25m8.25-8.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-7.5A2.25 2.25 0 018.25 18v-1.5m8.25-8.25h-6a2.25 2.25 0 00-2.25 2.25v6" />
            </svg>
          </div>
        )}
      </div>
    );
  }

  // FULL MODE (For Feed/Reels Player)
  if (type === "reel") {
    return (
      <div className={`w-full relative group ${isFeed ? "flex flex-col bg-[var(--bg-primary)] border-b border-[var(--border)] pb-4" : "h-full"}`}>
        {/* === TOP OVERLAY (FEED ONLY) === */}
        {isFeed && (
          <div className="absolute top-0 left-0 w-full p-3 z-20 bg-gradient-to-b from-black/60 to-transparent flex items-center justify-between pointer-events-none">
            <div className="flex items-center gap-3 pointer-events-auto">
              <Link to={`/user/${value.owner?._id}`} className="flex items-center gap-2">
                <StoryAvatar user={value.owner} size="w-8 h-8" />
                <span className="text-white font-bold text-sm shadow-black drop-shadow-md">
                  {value.owner?.name || "Deleted User"}
                </span>
              </Link>

              {/* FOLLOW BUTTON */}
              {user && user._id !== value.owner?._id && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    followHandler();
                  }}
                  className={`text-xs px-3 py-1 rounded-full backdrop-blur-md transition border font-medium ${isFollowed
                    ? "bg-[var(--text-primary)]/10 border-[var(--text-primary)]/20 text-[var(--text-primary)]/90"
                    : "bg-[var(--accent)] border-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90"
                    }`}
                >
                  {isFollowed ? "Following" : "Follow"}
                </button>
              )}
            </div>

            {/* Menu Button */}
            <div className="pointer-events-auto">
              {user && value.owner._id !== user._id && (
                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="text-white text-xl drop-shadow-lg opacity-80 hover:opacity-100 p-1"
                  >
                    <BsThreeDotsVertical />
                  </button>
                  {showMenu && (
                    <div className="absolute right-0 top-full mt-2 w-40 bg-[var(--card-bg)] rounded-xl shadow-2xl border border-[var(--border)] overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                      <button
                        onClick={notInterestedHandler}
                        className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2"
                      >
                        ❌ Not Interested
                      </button>
                      <button
                        onClick={muteHandler}
                        className="w-full text-left px-4 py-3 text-sm text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)] flex items-center gap-2 border-t border-[var(--border)]"
                      >
                        🔇 Mute @{value.owner?.name || "user"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Block this user? They will disappear from your feed.")) {
                            blockUser(value.owner?._id, null);
                            setIsHidden(true);
                          }
                          setShowMenu(false);
                        }}
                        className="w-full text-left px-4 py-3 text-sm text-[var(--danger)] hover:bg-[var(--bg-secondary)] flex items-center gap-2 border-t border-[var(--border)]"
                      >
                        🚫 Block User
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* FEED: Video Container with Aspect Ratio */}
        {/* PLAYER: Full Height Container */}
        <div className={`relative w-full ${isFeed ? "aspect-[9/16] bg-black" : "h-full"}`}>
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
            if (isFeed && type === "reel") {
              navigate(`/reels?id=${value._id}`);
            } else {
              if (isPlaying) { videoRef.current.pause(); setIsPlaying(false); }
              else { videoRef.current.play(); setIsPlaying(true); }
            }
          }} onDoubleClick={handleDoubleClick} className="w-full h-full cursor-pointer bg-black flex items-center justify-center">
            <video
              ref={videoRef}
              src={value.post.url}
              className="w-full h-full object-contain"
              loop
              playsInline
              muted={isFeed ? true : false}
              onTimeUpdate={(e) => {
                handleTimeUpdate(); // Trigger view count check
                if (videoRef.current) {
                  const current = videoRef.current.currentTime;
                  const duration = videoRef.current.duration;
                  if (duration > 0) setProgress((current / duration) * 100);
                }
              }}
              crossOrigin="anonymous"
            />
          </div>

          {/* BOTTOM PROGRESS BAR (Visible in both, slightly different style?) */}
          <div className="absolute bottom-0 left-0 w-full h-[3px] bg-gray-800/40 z-30">
            <div
              className="h-full bg-[var(--accent)] transition-all duration-100 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* RIGHT SIDE ACTIONS (PLAYER ONLY) */}
          {!isFeed && (
            <div className="absolute bottom-16 right-4 flex flex-col gap-6 items-center z-30">
              <div className="flex flex-col items-center gap-1">
                {/* View Count Indicator */}
                <div className="flex flex-col items-center animate-fade-in mb-3 opacity-90">
                  <IoEyeOutline size={22} className="text-white" />
                  <div className="flex flex-col items-center -mt-1">
                    <span className="text-white text-[11px] font-bold">
                      {(value.views || 0) + (viewTracked ? 1 : 0)}
                    </span>
                    <span className="text-[9px] text-gray-400 font-medium uppercase tracking-tighter">Views</span>
                  </div>
                </div>

                <button
                  onClick={() => feedbackHandler("vibeUp")}
                  className="group flex flex-col items-center gap-1.5 transition-transform active:scale-90"
                >
                  <div className={`p-2 rounded-full transition-colors ${isVibeUp ? "bg-[var(--accent)]/10" : "bg-white/5"}`}>
                    <VibeUpIcon active={isVibeUp} />
                  </div>
                  <span className={`text-[11px] font-bold tracking-tight ${isVibeUp ? "text-[var(--accent)]" : "text-gray-400"}`}>
                    Vibe Up
                  </span>
                </button>
                <span
                  onClick={() => setVibeModal(true)}
                  className="text-white text-[10px] font-medium drop-shadow-md cursor-pointer hover:underline opacity-80"
                >
                  {vibeUpCount}
                </span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <button
                  onClick={() => feedbackHandler("vibeDown")}
                  className="group flex flex-col items-center gap-1.5 transition-transform active:scale-90"
                >
                  <div className={`p-2 rounded-full transition-colors ${isVibeDown ? "bg-white/10" : "bg-white/5"}`}>
                    <VibeDownIcon active={isVibeDown} />
                  </div>
                  <span className={`text-[11px] font-bold tracking-tight ${isVibeDown ? "text-gray-300 opacity-100" : "text-gray-400"}`}>
                    Vibe Down
                  </span>
                </button>
                {isOwner && (
                  <span className="text-gray-500 text-[9px] font-medium drop-shadow-md uppercase tracking-tighter opacity-70">
                    {vibeDownCount} private
                  </span>
                )}
              </div>

              {/* COMMENT */}
              <div className="flex flex-col items-center gap-1">
                <button onClick={() => setShow(!show)} className="text-3xl text-white drop-shadow-lg transition-transform active:scale-95">
                  <BsChatFill />
                </button>
                <span className="text-white text-xs font-medium drop-shadow-md">{value.commentsCount || 0}</span>
              </div>

              {/* SHARE */}
              <div className="flex flex-col items-center gap-1 mt-1">
                <button
                  onClick={shareHandler}
                  className="text-2xl drop-shadow-lg transition-transform active:scale-95"
                >
                  <IoPaperPlaneOutline className="text-white" />
                </button>
                <span className="text-white text-xs font-medium drop-shadow-md">{sharesCount}</span>
              </div>

              {/* SAVE */}
              <div className="flex flex-col items-center gap-1 mt-1">
                <button onClick={saveHandler} className="text-[26px] drop-shadow-lg transition-transform active:scale-95">
                  {isSaved ? <BsBookmarkFill className="text-white" /> : <BsBookmark className="text-white" />}
                </button>
                <span className="text-white text-xs font-medium drop-shadow-md">{savesCount}</span>
              </div>

              {/* DELETE (if owner) */}
              {user && value.owner._id === user._id && (
                <button onClick={() => setShowPostDeleteConfirm(true)} className="text-white text-2xl drop-shadow-lg opacity-80 hover:opacity-100">
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
                        🔇 Mute @{value.owner?.name || "user"}
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Block this user? They will disappear from your feed.")) {
                            blockUser(value.owner?._id, null);
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
          )}

          {/* BOTTOM LEFT INFO (PLAYER ONLY) */}
          {!isFeed && (
            <div className="absolute bottom-6 left-4 right-16 z-30 text-white pointer-events-none">
              <div className="flex items-center gap-3 mb-3 pointer-events-auto">
                <Link to={`/user/${value.owner?._id}`} className="flex items-center gap-2">
                  <img
                    loading="lazy"
                    decoding="async"
                    src={value.owner?.profilePic?.url ? value.owner.profilePic.url.replace("/upload/", "/upload/f_auto,q_auto/") : "https://placehold.co/100"}
                    className="w-9 h-9 rounded-full border border-white/20 object-cover shrink-0"
                    alt=""
                  />
                  <span className="font-semibold text-sm shadow-black drop-shadow-md">{value.owner?.name || "Deleted User"}</span>
                </Link>

                {/* FOLLOW BUTTON */}
                {user && user._id !== value.owner?._id && (
                  <button
                    onClick={followHandler}
                    className={`text-xs px-3 py-1 rounded-lg backdrop-blur-md transition border ${isFollowed
                      ? "bg-white/10 border-white/30 text-white"
                      : "bg-[var(--accent)] border-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90"
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
              {/* Date below caption */}
              <p className="text-[var(--text-secondary)] text-xs mt-1 pointer-events-auto">{formatDate}</p>
            </div>
          )}
        </div>

        {/* === BOTTOM ACTION BAR (FEED ONLY) === */}
        {isFeed && (
          <div className="px-3 pt-3">
            {/* Action Row: Reals & Comments inline - Optimized for Mobile */}
            <div className="flex items-center justify-between sm:justify-start sm:gap-6 mb-3">

              <div className="flex items-center gap-4 sm:gap-6">
                <button
                  onClick={() => feedbackHandler("vibeUp")}
                  className="flex items-center gap-1.5 sm:gap-2 group transition-transform active:scale-95 translate-y-[-1px]"
                >
                  <div className={`transition-colors ${isVibeUp ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                    <VibeUpIcon active={isVibeUp} />
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap ${isVibeUp ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}
                  >
                    Vibe Up
                  </span>
                  <span
                    onClick={(e) => { e.stopPropagation(); setVibeModal(true); }}
                    className={`text-xs sm:text-sm font-medium ml-0.5 ${isVibeUp ? "text-[var(--accent)]" : "text-[var(--text-primary)]"} hover:underline`}
                  >
                    {vibeUpCount}
                  </span>
                </button>

                <button
                  onClick={() => feedbackHandler("vibeDown")}
                  className="flex items-center gap-1.5 sm:gap-2 group transition-transform active:scale-95 translate-y-[-1px]"
                >
                  <div className={`transition-colors ${isVibeDown ? "text-[var(--accent-secondary)]" : "text-[var(--text-primary)]"}`}>
                    <VibeDownIcon active={isVibeDown} />
                  </div>
                  <span
                    className={`text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap ${isVibeDown ? "text-[var(--accent-secondary)]" : "text-[var(--text-primary)]"}`}
                  >
                    Vibe Down
                  </span>
                  {isOwner && (
                    <span className="text-[10px] text-[var(--text-primary)] font-medium italic translate-y-[1px]">
                      {vibeDownCount}p
                    </span>
                  )}
                </button>
              </div>

              {/* Right Side Actions (Comment, Share, Save) */}
              <div className="flex items-center gap-4 sm:gap-6">
                {/* Comment Group */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={() => setShow(!show)}
                    className="text-xl sm:text-2xl transition-transform active:scale-75"
                  >
                    <BsChatFill className="text-[var(--text-primary)]" />
                  </button>
                  <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm">{value.commentsCount || 0}</span>
                </div>

                {/* Share Group */}
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={shareHandler}
                    className="text-xl sm:text-2xl transition-transform active:scale-75 text-[var(--text-primary)]"
                  >
                    <IoPaperPlaneOutline />
                  </button>
                  <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm">{sharesCount}</span>
                </div>

                <div className="flex items-center gap-1.5 sm:gap-2">
                  <button
                    onClick={saveHandler}
                    className="text-xl sm:text-2xl transition-transform active:scale-75 text-[var(--text-primary)]"
                  >
                    {isSaved ? <BsBookmarkFill className="text-[var(--text-primary)]" /> : <BsBookmark className="text-[var(--text-primary)]" />}
                  </button>
                  <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm">{savesCount}</span>
                </div>
              </div>
            </div>

            {/* Caption */}
            {value.caption && (
              <div className="text-[var(--text-primary)] text-sm mb-2">
                <Link to={`/user/${value.owner?._id}`} className="font-bold mr-2">
                  @{value.owner?.username || value.owner?.name?.toLowerCase().replace(/\s+/g, '_') || "user"}
                </Link>
                <span className="text-[var(--text-secondary)]">
                  {expanded ? value.caption : (value.caption?.slice(0, captionLimit) + (value.caption?.length > captionLimit ? "..." : ""))}
                </span>
                {
                  value.caption?.length > captionLimit && (
                    <button onClick={() => setExpanded(!expanded)} className="text-[var(--text-secondary)] text-xs ml-1 hover:text-[var(--text-primary)]">
                      {expanded ? "less" : "more"}
                    </button>
                  )
                }
              </div >
            )}

            {/* View Comments Link */}
            {
              value.commentsCount > 0 && (
                <button
                  onClick={() => setShow(!show)}
                  className="text-[var(--text-secondary)] text-xs font-medium"
                >
                  View all {value.commentsCount} comments
                </button>
              )
            }
            {/* Date */}
            <p className="text-[var(--text-secondary)] text-xs mt-1">{formatDate}</p>
          </div>
        )}

        <PostCardOverlays
          show={show} setShow={setShow} commentsRef={commentsRef} loadingComments={loadingComments} comments={comments}
          activeCommentMenuId={activeCommentMenuId} commentId={commentId} value={value} addComment={addComment} deleteComment={deleteComment}
          toggleCommentMenu={toggleCommentMenu} handleNewReply={handleNewReply} handleDeleteLocal={handleDeleteLocal} setReplyingTo={setReplyingTo}
          replyingTo={replyingTo} setComment={setComment} addCommentHandler={addCommentHandler} user={user} comment={comment}
          shareModal={shareModal} setShareModal={setShareModal} type={type} vibeModal={vibeModal} setVibeModal={setVibeModal}
          deleteModal={deleteModal} setDeleteModal={setDeleteModal} onShare={handleShareSuccess}
        />
      </div >
    );
  }

  // ===================== POST RENDER =====================
  return (
    <div className="bg-[var(--bg-primary)] w-full max-w-full overflow-hidden border-b border-[var(--border)] pb-4">
      {/* ===== POST IMAGE & OVERLAY HEADER ===== */}
      <div className="relative w-full group">
        {/* Header Overlay */}
        <div className="relative top-0 left-0 w-full pb-2 px-2 flex justify-between items-start z-10 pointer-events-none">
          <Link
            to={`/user/${value.owner?._id}`}
            className="flex  items-center gap-3 pointer-events-auto"
          >
            <div className="relative">
              <StoryAvatar user={value.owner} />
              {onlineUsers?.includes(value.owner?._id) && (
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border border-black z-10" />
              )}
            </div>
            <div className="flex flex-col">
              <p className="text-[var(--text-primary)] font-bold text-sm shadow-black drop-shadow-md">
                {value.owner?.name || "Deleted User"}
              </p>
              <p className="text-[var(--text-secondary)] text-[10px] font-medium drop-shadow-md">
                {formatDate}
              </p>
            </div>
          </Link>

          {/* Delete / Follow / Menu Button Overlay */}
          <div className="pointer-events-auto flex items-center gap-2">
            {user && value.owner._id === user._id ? (
              <div className="relative">
                <button
                  onClick={(e) => { e.stopPropagation(); setShowOwnerMenu(!showOwnerMenu); }}
                  className="p-2 rounded-full text-[var(--text-primary)] hover:text-[var(--accent)] hover:scale-110 transition-all drop-shadow-lg"
                >
                  <BsThreeDotsVertical className="text-sm" />
                </button>
                {showOwnerMenu && (
                  <div className="absolute right-0 top-full mt-2 w-40 bg-[#1F2937]/95 backdrop-blur-xl rounded-xl shadow-2xl border border-white/10 overflow-hidden z-[100] animate-in slide-in-from-top-2 fade-in duration-200">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowEditPage(true);
                        setShowOwnerMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-[var(--accent)] hover:bg-[var(--bg-secondary)] flex items-center gap-2 border-b border-[var(--border)] font-medium transition-colors"
                    >
                      Edit Post
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setShowPostDeleteConfirm(true);
                        setShowOwnerMenu(false);
                      }}
                      className="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[var(--bg-secondary)] flex items-center gap-2 font-medium transition-colors"
                    >
                      Delete Post
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={followHandler}
                  className={`text-xs font-bold px-4 py-1.5 rounded-full backdrop-blur-md transition-all duration-300 shadow-lg ${isFollowed
                    ? "bg-[var(--accent)]/10 text-[var(--accent)] border border-[var(--accent)]/40 hover:bg-[var(--accent)]/20 hover:shadow-[0_0_15px_rgba(0,255,209,0.2)]"
                    : "bg-[var(--accent)] text-[var(--text-on-accent)] hover:opacity-90 shadow-[0_0_15px_rgba(0,255,209,0.3)]"
                    }`}
                >
                  {isFollowed ? "Following" : "Follow"}
                </button>

                <div className="relative">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                    className="p-2 rounded-full text-[var(--text-primary)] hover:text-[var(--accent)] hover:scale-110 transition-all drop-shadow-lg"
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
                        🔇 Mute @{value.owner.username || value.owner.name?.toLowerCase().replace(/\s+/g, '_')}
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
        <div className="w-full aspect-[3/4] bg-black relative overflow-hidden flex items-center justify-center">
          <img
            src={getOptimizedImg(value.post.url, 800)}
            srcSet={`
              ${getOptimizedImg(value.post.url, 400)} 400w,
              ${getOptimizedImg(value.post.url, 800)} 800w,
              ${getOptimizedImg(value.post.url, 1200)} 1200w
            `}
            sizes="(max-width: 640px) 100vw, 650px"
            alt=""
            loading="lazy"
            decoding="async"
            onClick={() => setShowImage(true)}
            className="w-full h-full object-cover cursor-pointer active:opacity-95 transition-opacity"
            crossOrigin="anonymous"
          />
        </div>
      </div>

      {/* FULL SCREEN IMAGE VIEWER VIA PORTAL */}
      {
        showImage && createPortal(
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
              src={getOptimizedImg(value.post.url)}
              alt=""
              className="max-w-screen max-h-screen object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>,
          document.body
        )
      }

      {/* ===== ACTIONS & CAPTION ===== */}
      <div className="px-3 pt-3">
        {/* Action Row: Reals & Comments inline - Optimized for Mobile */}
        <div className="flex items-center justify-between sm:justify-start sm:gap-6 mb-3">

          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={() => feedbackHandler("vibeUp")}
              className="flex items-center gap-1.5 sm:gap-2 group transition-transform active:scale-95 translate-y-[-1px]"
            >
              <div className={`transition-colors ${isVibeUp ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}>
                <VibeUpIcon active={isVibeUp} />
              </div>
              <span
                className={`text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap ${isVibeUp ? "text-[var(--accent)]" : "text-[var(--text-primary)]"}`}
              >
                Vibe Up
              </span>
              <span
                onClick={(e) => { e.stopPropagation(); setVibeModal(true); }}
                className={`text-xs sm:text-sm font-medium ml-0.5 ${isVibeUp ? "text-[var(--accent)]" : "text-[var(--text-primary)]"} hover:underline`}
              >
                {vibeUpCount}
              </span>
            </button>

            <button
              onClick={() => feedbackHandler("vibeDown")}
              className="flex items-center gap-1.5 sm:gap-2 group transition-transform active:scale-95 translate-y-[-1px]"
            >
              <div className={`transition-colors ${isVibeDown ? "text-[var(--accent-secondary)]" : "text-[var(--text-primary)]"}`}>
                <VibeDownIcon active={isVibeDown} />
              </div>
              <span
                className={`text-xs sm:text-sm font-bold tracking-tight whitespace-nowrap ${isVibeDown ? "text-[var(--accent-secondary)]" : "text-[var(--text-primary)]"}`}
              >
                Vibe Down
              </span>
              {isOwner && (
                <span className="text-[10px] text-[var(--text-primary)] font-medium italic translate-y-[1px]">
                  {vibeDownCount}p
                </span>
              )}
            </button>
          </div>

          {/* Right Side Actions (Comment, Share, Save) */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Comment Group */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={() => setShow(!show)}
                className="text-xl sm:text-2xl transition-transform active:scale-75"
              >
                <BsChatFill className="text-[var(--text-primary)]" />
              </button>
              <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm">{value.commentsCount || 0}</span>
            </div>

            {/* Share Group */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={shareHandler}
                className="text-xl sm:text-2xl transition-transform active:scale-75 text-[var(--text-primary)]"
              >
                <IoPaperPlaneOutline />
              </button>
              <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm">{sharesCount}</span>
            </div>

            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={saveHandler}
                className="text-xl sm:text-2xl transition-transform active:scale-75 text-[var(--text-primary)]"
              >
                {isSaved ? <BsBookmarkFill className="text-[var(--text-primary)]" /> : <BsBookmark className="text-[var(--text-primary)]" />}
              </button>
              <span className="text-[var(--text-primary)] font-semibold text-xs sm:text-sm">{savesCount}</span>
            </div>
          </div>
        </div>

        {/* Caption */}
        {value.caption && (
          <div className="text-[var(--text-primary)] text-sm mb-2">
            <Link to={`/user/${value.owner?._id}`} className="font-bold mr-2">
              @{value.owner?.username || value.owner?.name?.toLowerCase().replace(/\s+/g, '_') || "user"}
            </Link>
            <span className="text-[var(--text-secondary)]">
              {expanded ? value.caption : (value.caption.slice(0, captionLimit) + (value.caption.length > captionLimit ? "..." : ""))}
            </span>
            {
              value.caption.length > captionLimit && (
                <button onClick={() => setExpanded(!expanded)} className="text-[var(--text-secondary)] text-xs ml-1 hover:text-[var(--text-primary)]">
                  {expanded ? "less" : "more"}
                </button>
              )
            }
          </div >
        )}

        {/* View Comments Link */}
        {
          value.commentsCount > 0 && (
            <button
              onClick={() => setShow(!show)}
              className="text-[var(--text-secondary)] text-xs font-medium"
            >
              View all {value.commentsCount} comments
            </button>
          )
        }
        <PostCardOverlays
          show={show} setShow={setShow} commentsRef={commentsRef} loadingComments={loadingComments} comments={comments}
          activeCommentMenuId={activeCommentMenuId} commentId={commentId} value={value} addComment={addComment} deleteComment={deleteComment}
          toggleCommentMenu={toggleCommentMenu} handleNewReply={handleNewReply} handleDeleteLocal={handleDeleteLocal} setReplyingTo={setReplyingTo}
          replyingTo={replyingTo} setComment={setComment} addCommentHandler={addCommentHandler} user={user} comment={comment}
          shareModal={shareModal} setShareModal={setShareModal} type={type} vibeModal={vibeModal} setVibeModal={setVibeModal}
          deleteModal={deleteModal} setDeleteModal={setDeleteModal} onShare={handleShareSuccess}
        />

        <Suspense fallback={null}>
          <ConfirmationModal
            isOpen={showPostDeleteConfirm}
            onClose={() => setShowPostDeleteConfirm(false)}
            onConfirm={() => deletePost(value._id)}
            title="Delete Post?"
            message="Are you sure you want to delete this post? This action cannot be undone."
            confirmText="Delete"
            type="danger"
          />
          <EditPostModal
            isOpen={showEditPage}
            onClose={() => setShowEditPage(false)}
            post={value}
            onUpdate={updatePost}
          />
        </Suspense>
      </div>
    </div >
  );
};

// --- Common UI Render Component (Extracted) ---
const PostCardOverlays = React.memo(({
  show, setShow, commentsRef, loadingComments, comments,
  activeCommentMenuId, commentId, value, addComment, deleteComment,
  toggleCommentMenu, handleNewReply, handleDeleteLocal, setReplyingTo,
  replyingTo, setComment, addCommentHandler, user, comment,
  shareModal, setShareModal, type, vibeModal, setVibeModal,
  deleteModal, setDeleteModal, onShare
}) => {
  return (
    <>
      {createPortal(
        <AnimatePresence mode="wait">
          {show && (
            <div
              key="comments-overlay"
              className="fixed inset-0 z-[100000] flex justify-center items-end"
              role="dialog"
            >
              {/* Backdrop */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 bg-black/80 backdrop-blur-sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setShow(false);
                }}
              />

              {/* Drawer */}
              <motion.div
                initial={{ y: "100%" }}
                animate={{ y: 0 }}
                exit={{ y: "100%" }}
                transition={{ type: "spring", damping: 30, stiffness: 300 }}
                className="relative w-full max-w-md bg-[var(--card-bg)] rounded-t-3xl h-[60vh] md:h-[75vh] flex flex-col shadow-2xl z-20 pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Drawer Handle */}
                <div className="w-full flex justify-center pt-3 pb-1 cursor-grab" onClick={() => setShow(false)}>
                  <div className="w-12 h-1.5 bg-[var(--border)] rounded-full opacity-60" />
                </div>

                <div className="flex justify-between items-center px-4 py-2 border-b border-[var(--border)]">
                  <h3 className="text-[var(--text-primary)] font-bold text-lg">Comments</h3>
                  <button onClick={() => setShow(false)} className="p-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">✕</button>
                </div>

                <div ref={commentsRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-4 custom-scrollbar relative">
                  <Suspense fallback={<div className="flex justify-center p-4 text-gray-400">Loading comments...</div>}>
                    {loadingComments ? (
                      <div className="flex justify-center items-center h-40">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[var(--accent)]"></div>
                      </div>
                    ) : comments && comments.length > 0 ? (
                      comments.map((c) => (
                        <CommentItem
                          key={c._id}
                          comment={c}
                          postId={value._id}
                          addComment={addComment}
                          deleteComment={deleteComment}
                          postOwnerId={value.owner?._id}
                          activeCommentMenuId={activeCommentMenuId}
                          activeCommentId={commentId}
                          toggleCommentMenu={toggleCommentMenu}
                          onReplyAdded={handleNewReply}
                          onDelete={handleDeleteLocal}
                          setReplyingTo={setReplyingTo}
                        />
                      ))
                    ) : (
                      <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
                        <BsChatFill className="text-4xl opacity-20" />
                        <p>No comments yet.</p>
                      </div>
                    )}
                  </Suspense>

                  {deleteModal.show && (
                    <div className="absolute inset-x-0 bottom-0 bg-[var(--bg-secondary)] p-4 rounded-t-2xl shadow-xl z-[60] border-t border-[var(--border)]">
                      <p className="text-[var(--text-primary)] text-center mb-4 font-semibold">Delete this comment?</p>
                      <div className="flex gap-3">
                        <button onClick={() => setDeleteModal({ show: false, commentId: null })} className="flex-1 py-2 rounded-lg bg-[var(--bg-primary)] text-[var(--text-primary)] font-medium border border-[var(--border)]">Cancel</button>
                        <button onClick={() => { deleteComment(value._id, deleteModal.commentId); setDeleteModal({ show: false, commentId: null }); }} className="flex-1 py-2 rounded-lg bg-red-600 text-white font-medium">Delete</button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="p-4 border-t border-[var(--border)] bg-[var(--card-bg)] pb-6 md:pb-4">
                  {replyingTo && (
                    <div className="flex justify-between items-center bg-[var(--bg-secondary)] px-4 py-2 rounded-t-lg mb-2 mx-1">
                      <span className="text-xs text-[var(--text-secondary)]">Replying to <span className="text-[var(--accent)] font-bold">@{replyingTo.user.username || replyingTo.user.name?.toLowerCase().replace(/\s+/g, '_')}</span></span>
                      <button onClick={() => setReplyingTo(null)} className="text-[var(--text-secondary)] hover:text-[var(--text-primary)]">✕</button>
                    </div>
                  )}
                  <div className="flex justify-between mb-3 px-2">
                    {["❤️", "🙌", "🔥", "👏", "😢", "😍", "😂"].map((emoji) => (
                      <button key={emoji} type="button" onClick={() => setComment((prev) => prev + emoji)} className="text-2xl hover:scale-125 transition-transform">{emoji}</button>
                    ))}
                  </div>
                  <form onSubmit={addCommentHandler} className="flex gap-3 items-center">
                    <img
                      loading="lazy"
                      decoding="async"
                      src={user?.profilePic?.url ? getOptimizedImg(user.profilePic.url) : "https://placehold.co/100"}
                      className="w-10 h-10 rounded-full border border-[var(--border)] object-cover"
                      alt=""
                    />
                    <div className="flex-1 relative">
                      <input type="text" className="w-full bg-[var(--bg-secondary)] text-[var(--text-primary)] text-sm rounded-full px-4 py-3 focus:outline-none focus:ring-1 focus:ring-[var(--accent)] border border-[var(--border)] placeholder:text-[var(--text-secondary)]" placeholder={replyingTo ? "Write a reply..." : `Comment as @${user?.username || user?.name?.toLowerCase().replace(/\s+/g, '_') || "guest"}...`} value={comment} onChange={(e) => setComment(e.target.value)} autoFocus={!!replyingTo} />
                      <button type="submit" disabled={!comment.trim()} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--accent)] font-bold text-sm hover:opacity-80 disabled:opacity-50 px-3">Post</button>
                    </div>
                  </form>
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>,
        document.body
      )}

      <Suspense fallback={null}>
        {shareModal && (
          <ShareModal
            isOpen={shareModal}
            onClose={() => setShareModal(false)}
            onShare={onShare}
            content={{
              type: type === "reel" ? "reel" : "post",
              contentId: value._id,
              owner: value.owner,
              preview: { title: value.caption, image: value.post.url, username: value.owner?.username || value.owner?.name || "unknown" }
            }}
          />
        )}

        {vibeModal && <VibeModal isOpen={vibeModal} onClose={() => setVibeModal(false)} id={value._id} />}
      </Suspense>
    </>
  );
});

// Memoize PostCard to prevent unnecessary re-renders
export default React.memo(PostCard, (prevProps, nextProps) => {
  // Only re-render if post ID or critical data changed
  return (
    prevProps.value._id === nextProps.value._id &&
    prevProps.value.vibesUp?.length === nextProps.value.vibesUp?.length &&
    prevProps.value.vibesDown?.length === nextProps.value.vibesDown?.length &&
    prevProps.value.commentsCount === nextProps.value.commentsCount &&
    prevProps.value.sharesCount === nextProps.value.sharesCount &&
    prevProps.value.savesCount === nextProps.value.savesCount &&
    prevProps.isActive === nextProps.isActive &&
    prevProps.commentId === nextProps.commentId &&
    prevProps.openComments === nextProps.openComments
    // NOTE: We do NOT check 'user' here because Context handles user changes? 
    // Actually, if 'user' follows change, the internal state updates via useEffect.
    // So props comparison is mostly fine for list virtualization.
  );
});
