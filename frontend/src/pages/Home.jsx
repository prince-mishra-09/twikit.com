import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoChatbubbleEllipsesOutline, IoNotificationsOutline } from "react-icons/io5";
import AddPost from "../components/AddPost";
import PostCard from "../components/PostCard";
import { PostData } from "../context/PostContext";
import { NotificationData } from "../context/NotificationContext";
import { ChatData } from "../context/ChatContext";
import { Loading } from "../components/Loading";

const Home = () => {
  const { posts, loading } = PostData();
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

  if (loading) return <Loading />;

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
        <div className="mt-1 space-y-6">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post._id} value={post} type="post" />
            ))
          ) : (
            <div className="flex flex-col items-center justify-center p-8 mt-12 text-center opacity-0 animate-in fade-in slide-in-from-bottom-4 fill-mode-forwards duration-700 delay-200" style={{ animationFillMode: 'forwards' }}>
              <div className="w-16 h-16 bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 rounded-2xl flex items-center justify-center mb-4 border border-white/5 shadow-2xl shadow-indigo-500/10">
                <span className="text-3xl">✨</span>
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Your feed is clean</h3>
              <p className="text-gray-400 max-w-xs mx-auto text-sm leading-relaxed">
                Follow more people or explore the community to see posts here.
              </p>
              <Link
                to="/search" // Assuming there's a search/explore page or similar
                className="mt-6 px-6 py-2.5 bg-white text-black font-semibold rounded-full hover:bg-gray-200 transition-all active:scale-95 text-sm"
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
