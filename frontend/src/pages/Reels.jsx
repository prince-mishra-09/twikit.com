import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";

const Reels = () => {
  const navigate = useNavigate();
  const { reels, loading } = PostData();
  const [currentReelId, setCurrentReelId] = useState(null);
  const [displayReels, setDisplayReels] = useState([]);

  // Logic to handle deep link and Reordering
  useEffect(() => {
    if (!reels || reels.length === 0) return;

    const params = new URLSearchParams(window.location.search);
    const reelId = params.get("id");

    if (reelId) {
      const selectedReel = reels.find(r => r._id === reelId);
      if (selectedReel) {
        const otherReels = reels.filter(r => r._id !== reelId);
        setDisplayReels([selectedReel, ...otherReels]);
        // Also set initial active reel
        setCurrentReelId(reelId);
      } else {
        setDisplayReels(reels);
      }
    } else {
      setDisplayReels(reels);
    }
  }, [reels, window.location.search]);

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
  }, [displayReels]); // Observe on displayReels change

  return (
    <div className="h-[100dvh] w-full bg-black overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative flex justify-center">
      {/* Back Button - Absolute for easy exit */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-50 p-3 bg-white/10 backdrop-blur-md rounded-full text-white border border-white/20 hover:bg-white/20 transition-all group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>

      {loading ? (
        <div className="h-full w-full flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-white/20 border-t-[var(--accent)] rounded-full animate-spin" />
        </div>
      ) : displayReels && displayReels.length > 0 ? (
        <div className="w-full h-full max-w-md md:max-w-lg lg:max-w-xl relative">
          {displayReels.map((reel) => (
            <div
              key={reel._id}
              id={reel._id}
              className="reel-container h-[100dvh] w-full snap-start snap-always flex justify-center items-center py-4"
            >
              <div className="w-full h-full relative flex items-center justify-center bg-black rounded-lg overflow-hidden shadow-2xl shadow-black/50">
                {/* Pass isReelPage prop if needed for specific styling in PostCard */}
                <PostCard value={reel} type="reel" isActive={currentReelId === reel._id} />
              </div>
            </div>
          ))}

          {/* End of Reels Message */}
          <div className="h-[100dvh] w-full snap-start snap-always flex flex-col items-center justify-center p-8 text-center bg-black">
            <div className="w-20 h-20 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
              <span className="text-4xl animate-bounce">🎬</span>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">That's all for now!</h3>
            <p className="text-white/50 text-base max-w-[280px] mb-8">
              You've reached the end of the spotlight. Come back later for more!
            </p>
            <button
              onClick={() => {
                const firstReel = document.querySelector('.reel-container');
                if (firstReel) firstReel.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-white/90 transition-all active:scale-95"
            >
              Replay Feed
            </button>
          </div>
        </div>
      ) : (
        <div className="h-screen flex items-center justify-center text-[var(--text-secondary)]">
          <div className="text-center">
            <h3 className="text-xl font-bold mb-2">No reels yet</h3>
            <p className="opacity-70">Check back later for new vibes.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reels;
