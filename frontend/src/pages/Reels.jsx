import React, { useRef, useState } from "react";
import AddPost from "../components/AddPost";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { FaArrowUp, FaArrowDownLong } from "react-icons/fa6";
import { Loading } from "../components/Loading";

const Reels = () => {
  const { reels, loading } = PostData();
  const [index, setIndex] = useState(0);
  const touchStartY = useRef(null);

  const prevReel = () => {
    if (index === 0) return;
    setIndex((prev) => prev - 1);
  };

  const nextReel = () => {
    if (index === reels.length - 1) return;
    setIndex((prev) => prev + 1);
  };

  /* Mobile scroll / swipe */
  const handleWheel = (e) => {
    if (e.deltaY > 0) nextReel();
    else prevReel();
  };

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e) => {
    if (!touchStartY.current) return;
    const diff = touchStartY.current - e.changedTouches[0].clientY;
    if (diff > 50) nextReel();
    if (diff < -50) prevReel();
    touchStartY.current = null;
  };

  if (loading) return <Loading />;

  return (
    <div className="min-h-screen bg-[#0B0F14] flex flex-col items-center pb-24">
      <AddPost type="reel" />

      <div
        className="relative w-full max-w-md mt-6 flex justify-center"
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {reels && reels.length > 0 ? (
          <PostCard value={reels[index]} type="reel" />
        ) : (
          <p className="text-gray-400">No reels yet</p>
        )}

        {/* Desktop arrows */}
        <div className="hidden md:flex flex-col gap-6 absolute right-[-70px]">
          {index !== 0 && (
            <button
              onClick={prevReel}
              className="bg-[#111827] border border-white/10 text-white p-4 rounded-full hover:bg-indigo-500"
            >
              <FaArrowUp />
            </button>
          )}
          {index !== reels.length - 1 && (
            <button
              onClick={nextReel}
              className="bg-[#111827] border border-white/10 text-white p-4 rounded-full hover:bg-indigo-500"
            >
              <FaArrowDownLong />
            </button>
          )}
        </div>
      </div>

      <p className="md:hidden text-gray-400 text-sm mt-4">
        Swipe up or down to explore reels
      </p>
    </div>
  );
};

export default Reels;
