import React, { useRef, useState, useEffect } from "react";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { Loading } from "../components/Loading";

const Reels = () => {
  const { reels, loading } = PostData();
  const [currentReelId, setCurrentReelId] = useState(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setCurrentReelId(entry.target.id);
          }
        });
      },
      {
        threshold: 0.6,
      }
    );

    const reelElements = document.querySelectorAll(".reel-container");
    reelElements.forEach((el) => observer.observe(el));

    return () => {
      reelElements.forEach((el) => observer.unobserve(el));
    };
  }, [reels]);

  if (loading) return <Loading />;

  return (
    <div className="h-[100dvh] w-full bg-[#0B0F14] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative">
      {/* Back Button */}
      <a href="/" className="absolute top-4 left-4 z-50 p-2 bg-black/40 backdrop-blur-md rounded-full text-white border border-white/20">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-6 h-6">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </a>

      {reels && reels.length > 0 ? (
        reels.map((reel) => (
          <div
            key={reel._id}
            id={reel._id}
            className="reel-container h-[100dvh] w-full snap-start flex justify-center items-center relative"
          >
            <div className="w-full h-full md:max-w-md relative flex items-center bg-black">
              <PostCard value={reel} type="reel" isActive={currentReelId === reel._id} />
            </div>
          </div>
        ))
      ) : (
        <div className="h-screen flex items-center justify-center text-gray-400">
          No reels yet
        </div>
      )}
    </div>
  );
};

export default Reels;
