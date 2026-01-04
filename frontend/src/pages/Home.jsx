import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IoChatbubbleEllipsesOutline } from "react-icons/io5";
import AddPost from "../components/AddPost";
import PostCard from "../components/PostCard";
import { PostData } from "../context/PostContext";
import { Loading } from "../components/Loading";

const Home = () => {
  const { posts, loading } = PostData();

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
      <div className="w-full max-w-xl px-3 pb-10">

        {/* Header + Composer */}
        <div
          className={`sticky top-0 z-20 transition-all duration-300 bg-[#0B0F14]/90 backdrop-blur-md pb-2 ${showComposer
            ? "translate-y-0 opacity-100"
            : "-translate-y-40 opacity-0 pointer-events-none"
            }`}
        >
          {/* Top Header */}
          <div className="flex justify-between items-center py-4 px-1">
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              Twikit
            </h1>
            <Link to="/chat" className="text-2xl text-gray-300 hover:text-white transition relative">
              <IoChatbubbleEllipsesOutline />
              {/* Optional: Add red dot if unread messages exist (future task) */}
            </Link>
          </div>
        </div>

        {/* Posts */}
        <div className="mt-6 space-y-6">
          {posts && posts.length > 0 ? (
            posts.map((post) => (
              <PostCard key={post._id} value={post} type="post" />
            ))
          ) : (
            <p className="text-center text-gray-400 mt-16">
              No posts yet. Be the first one ✨
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Home;
