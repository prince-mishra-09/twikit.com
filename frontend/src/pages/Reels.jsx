import React, { useRef, useState } from "react";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";
import { Loading } from "../components/Loading";

const Reels = () => {
  const { reels, loading } = PostData();

  if (loading) return <Loading />;

  return (
    <div className="h-screen w-full bg-[#0B0F14] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar">
      {reels && reels.length > 0 ? (
        reels.map((reel) => (
          <div key={reel._id} className="h-screen w-full snap-start flex justify-center items-center">
            <div className="w-full h-full max-w-md relative flex items-center bg-black">
              <PostCard value={reel} type="reel" />
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
