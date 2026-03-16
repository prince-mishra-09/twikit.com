import React, { useEffect, useState, useRef } from "react";
import { toast } from "react-hot-toast";
import { Link, useNavigate } from "react-router-dom";
import { IoChatbubbleEllipsesOutline, IoNotificationsOutline, IoBugOutline } from "react-icons/io5";
import AddPost from "../components/AddPost";
import StoryRow from "../components/StoryRow"; // Import StoryRow
import PostCard from "../components/PostCard";
import { PostData } from "../context/PostContext";
import { NotificationData } from "../context/NotificationContext";
import { ChatData } from "../context/ChatContext";
import { SkeletonPost } from "../components/Skeleton";
import { UserData } from "../context/UserContext";
import { useTheme } from "../context/ThemeContext";
import BugReportTooltip from "../components/BugReportTooltip";


const Home = () => {
  const { isAuth, searchUser, setShowLoginPrompt } = UserData();
  const { posts, reels, loading, fetchNextPage, loadingMore, pagination, addLoading, uploadProgress, uploadPreview, uploadType } = PostData();
  const { unreadCount } = NotificationData();
  const { createChat, setSelectedChat, totalUnreadMessages } = ChatData();
  const { theme, cycleTheme } = useTheme();

  const navigate = useNavigate();

  const handleReportBug = async () => {
    if (!isAuth) return setShowLoginPrompt(true);
    const toastId = toast.loading("Connecting to support...");
    try {
      const users = await searchUser("admin_prince");
      const admin = users.find(u => u.username === "admin_prince");
      if (admin) {
        const chat = await createChat(admin._id);
        if (chat) {
          setSelectedChat(chat);
          navigate("/chat", { state: { isBugReport: true } });
          toast.success("Chat opened", { id: toastId });
        } else {
          throw new Error("Could not create chat");
        }
      } else {
        toast.error("Admin user not found", { id: toastId });
        navigate("/chat");
      }
    } catch (error) {
      toast.error("Something went wrong", { id: toastId });
      navigate("/chat");
    }
  };

  const [showComposer, setShowComposer] = useState(true);
  const lastScrollY = useRef(0); // Use ref to avoid re-binding listener

  // Merge and sort posts and reels by date, then mix to avoid consecutive posts from same user
  const allContent = React.useMemo(() => {
    // Deduplicate items by _id in case a reel appears in both arrays
    const combinedMap = new Map();
    [...(posts || []), ...(reels || [])].forEach(item => {
      combinedMap.set(item._id, item);
    });

    let combined = Array.from(combinedMap.values()).sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt)
    );

    // Mixing Algorithm: Prevent same user from appearing consecutively
    // We try to swap a conflicting post with the next available post from a different user
    for (let i = 1; i < combined.length; i++) {
      const prev = combined[i - 1];
      const current = combined[i];

      if (prev.owner._id === current.owner._id) {
        // Conflict found. Look ahead for a replacement.
        let swapIndex = -1;
        for (let j = i + 1; j < combined.length; j++) {
          if (combined[j].owner._id !== current.owner._id) {
            swapIndex = j;
            break;
          }
        }

        if (swapIndex !== -1) {
          // Swap
          [combined[i], combined[swapIndex]] = [combined[swapIndex], combined[i]];
        }
      }
    }

    return combined;
  }, [posts, reels]);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;

      // Always show navbar when at the top
      if (current < 10) {
        setShowComposer(true);
        lastScrollY.current = current;
        return;
      }

      // Scrolling down -> hide navbar
      // Scrolling up -> show navbar
      if (current > lastScrollY.current) {
        setShowComposer(false);
      } else if (current < lastScrollY.current) {
        setShowComposer(true);
      }
      lastScrollY.current = current;
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []); // Dependence array is empty now!


  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center">

      {/* 2. Main Feed (Center) */}
      <div className="w-full max-w-[630px] flex flex-col items-center"> {/* Margins for sidebars handled by Layout */}

        {/* Mobile Header (Hide on md+) */}
        <div
          className={`md:hidden sticky top-0 z-[100] w-full transition-all duration-300 bg-[var(--bg-primary)]/90 backdrop-blur-md pb-2 ${showComposer
            ? "translate-y-0 opacity-100"
            : "-translate-y-40 opacity-0 pointer-events-none"
            }`}
        >
          {/* Top Header */}
          <div className="flex justify-between items-center py-2 px-3">
            <Link to="/" className="flex items-center gap-3">
              <div className="flex items-center justify-center">
                <img
                  src={theme === "matcha" || theme === "retro" ? "/images/xwaked-black.png" : "/images/xwaked-white.png"}
                  alt="xwaked Logo"
                  className="h-12 w-auto"
                />
              </div>
              <span className="text-3xl font-black text-[var(--text-primary)] tracking-tighter leading-none">
                {/* xwaked */}
              </span>
            </Link>
            <div className="flex items-center gap-3">
              {isAuth && (
                <>
                  <div className="relative">
                    <button
                      onClick={handleReportBug}
                      className="bg-[var(--warning)]/10 p-2 text-[var(--warning)] rounded-full hover:bg-[var(--warning)]/20 transition-all"
                      title="Report a Bug"
                    >
                      <IoBugOutline className="text-xl" />
                    </button>
                    <BugReportTooltip position="bottom" />
                  </div>
                  <Link
                    to="/notifications"
                    className="relative bg-[var(--text-primary)]/10 p-2 text-[var(--text-primary)] rounded-full hover:bg-[var(--text-primary)]/20 transition-all"
                  >
                    <IoNotificationsOutline className="text-xl" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[var(--danger)] text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--bg-primary)]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/chat"
                    className="relative bg-[var(--text-primary)]/10 p-2 text-[var(--text-primary)] rounded-full hover:bg-[var(--text-primary)]/20 transition-all"
                  >
                    <IoChatbubbleEllipsesOutline className="text-xl" />
                    {totalUnreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-[var(--danger)] text-[var(--text-on-accent)] text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--bg-primary)]">
                        {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                      </span>
                    )}
                  </Link>
                </>
              )}
              {!isAuth && (
                <Link
                  to="/login"
                  className="bg-[var(--accent)] text-white px-5 py-2 rounded-full font-bold text-sm hover:opacity-90 transition-all"
                >
                  Log In
                </Link>
              )}
            </div>
          </div>
        </div>

        {/* Feed Content */}
        <div className="w-full pb-20 md:pb-0 md:pt-8 px-0 md:px-0">

          {/* Stories */}
          <div className="mb-4 md:mb-8">
            <StoryRow />
          </div>

          {/* Global Upload Progress */}
          {addLoading && uploadProgress > 0 && (
            <div className="w-full px-4 md:px-0 mt-2 mb-4 relative z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="flex items-center gap-4 py-2">
                {uploadPreview && (
                  <div className="w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-[var(--bg-secondary)] border border-[var(--border)]">
                    {uploadType === "reel" ? (
                      <video src={uploadPreview} className="w-full h-full object-cover" />
                    ) : (
                      <img src={uploadPreview} alt="uploading" className="w-full h-full object-cover" />
                    )}
                  </div>
                )}

                <div className="flex-1 flex flex-col justify-center gap-1.5 min-w-0">
                  <div className="flex justify-between items-center text-sm font-medium">
                    <span className="text-[var(--text-primary)] truncate font-semibold capitalize">
                      {uploadProgress === 100 ? "Finishing up..." : `Uploading ${uploadType}...`}
                    </span>
                    <span className="text-[var(--text-secondary)] font-bold">{uploadProgress}%</span>
                  </div>
                  <div className="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[var(--accent)] transition-all duration-300 ease-out relative"
                      style={{ width: `${uploadProgress}%` }}
                    >
                      <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <SkeletonPost key={i} />)}
            </div>
          ) : allContent && allContent.length > 0 ? (
            <>
              <div className="space-y-4 flex flex-col items-center">
                {/* Center PostCards */}
                {allContent.map((item) => (
                  <div key={item._id} className="w-full md:w-[470px]"> {/* Limit width on desktop */}
                    <PostCard key={item._id} value={item} type={item.type} isFeed={true} />
                  </div>
                ))}
              </div>

              {/* Load More Button or End of Feed Message */}
              {pagination.hasMorePosts ? (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={fetchNextPage}
                    disabled={loadingMore}
                    className="px-6 py-2 m-4 bg-[var(--card-bg)] text-[var(--text-primary)] text-sm font-semibold rounded-full hover:bg-[var(--border)] disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loadingMore ? "Loading..." : "Load More"}
                  </button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 px-4 transition-all animate-in fade-in slide-in-from-bottom-4 duration-700">
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[var(--text-secondary)]/30 to-transparent mb-6" />
                  <div className="bg-[var(--card-bg)] p-3 rounded-2xl mb-4 shadow-sm border border-[var(--border)]/10">
                    <span className="text-2xl">✨</span>
                  </div>
                  <h4 className="text-[var(--text-primary)] font-bold text-lg mb-1">
                    You're all caught up
                  </h4>
                  <p className="text-[var(--text-secondary)] text-sm text-center max-w-[250px]">
                    You've seen all the latest posts from the people you follow.
                  </p>
                  <button
                    onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                    className="mt-6 text-[var(--accent)] text-xs font-bold uppercase tracking-widest hover:opacity-70 transition-opacity"
                  >
                    Back to top
                  </button>
                  <div className="h-[1px] w-12 bg-gradient-to-r from-transparent via-[var(--text-secondary)]/30 to-transparent mt-8" />
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center w-full z-10 relative">
              <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">No posts yet</h3>
              <p className="text-[var(--text-secondary)] text-base mb-6">
                Be the first to post something or follow others!
              </p>
              <Link
                to="/search"
                className="px-6 py-2 bg-[var(--text-primary)] text-[var(--bg-primary)] font-semibold rounded-full hover:opacity-90 transition-opacity"
              >
                Discover People
              </Link>
            </div>
          )}
        </div>
      </div>

    </div>
  );
};

export default Home;
