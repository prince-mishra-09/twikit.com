import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoChatbubbleEllipsesOutline, IoNotificationsOutline } from "react-icons/io5";
import AddPost from "../components/AddPost";
import StoryRow from "../components/StoryRow"; // Import StoryRow
import PostCard from "../components/PostCard";
import { PostData } from "../context/PostContext";
import { NotificationData } from "../context/NotificationContext";
import { ChatData } from "../context/ChatContext";
import { SkeletonPost } from "../components/Skeleton";
import { UserData } from "../context/UserContext";

const Home = () => {
  const { isAuth } = UserData();
  const { posts, reels, loading, fetchNextPage, loadingMore, pagination, addLoading, uploadProgress } = PostData();
  const { unreadCount } = NotificationData();
  const { totalUnreadMessages } = ChatData();

  const [showComposer, setShowComposer] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Merge and sort posts and reels by date
  const allContent = [...(posts || []), ...(reels || [])].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  useEffect(() => {
    const handleScroll = () => {
      const mainContent = document.getElementById("main-content");
      if (!mainContent) return;
      const current = mainContent.scrollTop;

      // small threshold to avoid flicker
      if (Math.abs(current - lastScrollY) < 10) return;

      if (current > lastScrollY) {
        // scrolling down -> show composer
        setShowComposer(false);
      } else {
        // scrolling up -> hide composer
        setShowComposer(true);
      }

      setLastScrollY(current);
    };

    const mainContent = document.getElementById("main-content");
    if (mainContent) {
      mainContent.addEventListener("scroll", handleScroll, { passive: true });
    } else {
      window.addEventListener("scroll", handleScroll, { passive: true });
    }

    return () => {
      if (mainContent) {
        mainContent.removeEventListener("scroll", handleScroll);
      } else {
        window.removeEventListener("scroll", handleScroll);
      }
    };
  }, [lastScrollY]);



  return (
    <div className="min-h-screen bg-[var(--bg-primary)] flex justify-center md:px-4">
      {/* Fixed Top Upload Progress Removed */}
      {/* Feed container */}
      <div className="w-full max-w-2xl pb-20">

        {/* Header + Composer */}
        <div
          className={`sticky top-0 z-20 transition-all duration-300 bg-[var(--bg-primary)]/90 backdrop-blur-md pb-2 ${showComposer
            ? "translate-y-0 opacity-100"
            : "-translate-y-40 opacity-0 pointer-events-none"
            }`}
        >
          {/* Top Header */}
          <div className="flex justify-between items-center py-2 px-3">
            <h1 className="text-xl font-bold bg-[var(--text-primary)]/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-[var(--border)] shadow-lg shadow-[var(--accent)]/10 text-[var(--text-primary)] tracking-wide">
              Twikit
            </h1>
            <div className="flex items-center gap-3">
              {isAuth && (
                <>
                  <Link
                    to="/notifications"
                    className="relative bg-[var(--text-primary)]/10 p-2.5 rounded-full backdrop-blur-md border border-[var(--border)] hover:bg-[var(--text-primary)]/20 transition-all duration-300 text-[var(--text-primary)] shadow-lg shadow-[var(--accent)]/10 group"
                  >
                    <IoNotificationsOutline className="text-xl group-hover:rotate-12 transition-transform" />
                    {unreadCount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--bg-primary)]">
                        {unreadCount > 9 ? "9+" : unreadCount}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/chat"
                    className="relative bg-[var(--text-primary)]/10 p-2.5 rounded-full backdrop-blur-md border border-[var(--border)] hover:bg-[var(--text-primary)]/20 transition-all duration-300 text-[var(--text-primary)] shadow-lg shadow-[var(--accent)]/10 group"
                  >
                    <IoChatbubbleEllipsesOutline className="text-xl group-hover:scale-110 transition-transform" />
                    {totalUnreadMessages > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[var(--bg-primary)]">
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

        {/* Posts */}
        <div className="mt-2">
          <StoryRow />

          {/* Global Upload Progress */}
          {/* Global Upload Progress */}
          {addLoading && uploadProgress > 0 && (
            <div className="mx-4 mb-6 relative z-50 animate-in fade-in slide-in-from-top-2 duration-300">
              <div className="h-1 bg-gray-800/50 rounded-full overflow-hidden border border-white/5 ring-1 ring-white/10 shadow-lg">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_100%] animate-[shimmer_2s_infinite] shadow-[0_0_12px_rgba(99,102,241,0.8)] transition-all duration-300 ease-out"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <SkeletonPost key={i} />)}
            </div>
          ) : allContent && allContent.length > 0 ? (
            <>
              <div className="space-y-4">
                {allContent.map((item) => (
                  <PostCard key={item._id} value={item} type={item.type} isFeed={true} />
                ))}
              </div>

              {/* Load More Button */}
              {pagination.hasMorePosts && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={fetchNextPage}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-[var(--accent)] text-white font-semibold rounded-full hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loadingMore ? "Loading..." : "Load More Posts"}
                  </button>
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
      </div >
    </div >
  );
};

export default Home;

