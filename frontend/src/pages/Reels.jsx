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
    <div className="h-[100dvh] w-full bg-[#0B0F14] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
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
