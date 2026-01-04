import React, { useEffect, useState } from "react";
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
        
        {/* Composer */}
        <div
          className={`sticky top-3 z-20 transition-all duration-300 ${
            showComposer
              ? "translate-y-0 opacity-100"
              : "-translate-y-32 opacity-0"
          }`}
        >
          <AddPost type="post" />
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
