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

const Home = () => {
  const { posts, loading, fetchNextPage, loadingMore, pagination } = PostData();
  const { unreadCount } = NotificationData();
  const { totalUnreadMessages } = ChatData();

  const [showComposer, setShowComposer] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const current = window.scrollY;

      // small threshold to avoid flicker
      if (Math.abs(current - lastScrollY) < 10) return;

      if (current > lastScrollY) {
        // scrolling down → show composer
        setShowComposer(false);
      } else {
        // scrolling up → hide composer
        setShowComposer(true);
      }

      setLastScrollY(current);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);



  return (
    <div className="min-h-screen bg-[#0B0F14] flex justify-center">
      {/* Feed container */}
      <div className="w-full max-w-xl pb-20">

        {/* Header + Composer */}
        <div
          className={`sticky top-0 z-20 transition-all duration-300 bg-[#0B0F14]/90 backdrop-blur-md pb-2 ${showComposer
            ? "translate-y-0 opacity-100"
            : "-translate-y-40 opacity-0 pointer-events-none"
            }`}
        >
          {/* Top Header */}
          <div className="flex justify-between items-center py-4 px-3">
            <h1 className="text-xl font-bold bg-white/10 px-4 py-1.5 rounded-full backdrop-blur-md border border-white/5 shadow-lg shadow-indigo-500/10 text-white tracking-wide">
              Twikit
            </h1>
            <div className="flex items-center gap-3">
              <Link
                to="/notifications"
                className="relative bg-white/10 p-2.5 rounded-full backdrop-blur-md border border-white/5 hover:bg-white/20 transition-all duration-300 text-white shadow-lg shadow-indigo-500/10 group"
              >
                <IoNotificationsOutline className="text-xl group-hover:rotate-12 transition-transform" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#0B0F14]">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </Link>
              <Link
                to="/chat"
                className="relative bg-white/10 p-2.5 rounded-full backdrop-blur-md border border-white/5 hover:bg-white/20 transition-all duration-300 text-white shadow-lg shadow-indigo-500/10 group"
              >
                <IoChatbubbleEllipsesOutline className="text-xl group-hover:scale-110 transition-transform" />
                {totalUnreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold w-4 h-4 flex items-center justify-center rounded-full border-2 border-[#0B0F14]">
                    {totalUnreadMessages > 9 ? "9+" : totalUnreadMessages}
                  </span>
                )}
              </Link>
            </div>
          </div>
        </div>

        {/* Posts */}
        <div className="mt-4">
          <StoryRow />
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => <SkeletonPost key={i} />)}
            </div>
          ) : posts && posts.length > 0 ? (
            <>
              <div className="space-y-4">
                {posts.map((post) => (
                  <PostCard key={post._id} value={post} type="post" />
                ))}
              </div>

              {/* Load More Button */}
              {pagination.hasMorePosts && (
                <div className="flex justify-center mt-6">
                  <button
                    onClick={fetchNextPage}
                    disabled={loadingMore}
                    className="px-6 py-3 bg-indigo-600 text-white font-semibold rounded-full hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                  >
                    {loadingMore ? "Loading..." : "Load More Posts"}
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-[60vh] text-center w-full z-10 relative">
              <h3 className="text-2xl font-bold text-white mb-2">No posts yet</h3>
              <p className="text-gray-300 text-base mb-6">
                Be the first to post something or follow others!
              </p>
              <Link
                to="/search"
                className="px-6 py-2 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-colors"
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
