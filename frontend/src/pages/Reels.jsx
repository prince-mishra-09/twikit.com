import React, { useRef, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { PostData } from "../context/PostContext";
import PostCard from "../components/PostCard";

const Reels = () => {
  const navigate = useNavigate();
  const { reels, loadingReels, fetchReels, fetchNextReelsPage, reelsPagination } = PostData();
  const [currentReelId, setCurrentReelId] = useState(null);
  const [displayReels, setDisplayReels] = useState([]);

  // Fetch reels specifically on mount
  useEffect(() => {
    if (reels.length === 0) {
      fetchReels();
    }
  }, [fetchReels, reels.length]);

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
            // Infinite scroll trigger: If the user reaches the last reel, fetch more
            const isLastReel = entry.target === reelElements[reelElements.length - 1];
            if (isLastReel && reelsPagination?.hasMoreReels) {
                fetchNextReelsPage();
            }
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
    <div className="h-[100dvh] w-full bg-[var(--bg-primary)] overflow-y-scroll snap-y snap-mandatory scroll-smooth no-scrollbar relative flex justify-center">
      {/* Back Button - Absolute for easy exit */}
      <button
        onClick={() => navigate(-1)}
        className="absolute top-6 left-6 z-50 p-3 bg-[var(--surface-glass)] backdrop-blur-md rounded-full text-[var(--text-primary)] border border-[var(--border)]/20 hover:bg-[var(--text-primary)]/10 transition-all group"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-6 h-6 group-hover:-translate-x-1 transition-transform">
          <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5 3 12m0 0 7.5-7.5M3 12h18" />
        </svg>
      </button>

      {loadingReels && reels.length === 0 ? (
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
              <div className="w-full h-full relative flex items-center justify-center bg-[var(--bg-primary)] rounded-lg overflow-hidden shadow-2xl shadow-[var(--overlay)]/20">
                {/* Pass isReelPage prop if needed for specific styling in PostCard */}
                <PostCard value={reel} type="reel" isActive={currentReelId === reel._id} />
              </div>
            </div>
          ))}

          {/* End of Reels Message */}
          <div className="h-[100dvh] w-full snap-start snap-always flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-primary)]">
            <div className="w-20 h-20 bg-[var(--bg-secondary)] rounded-full flex items-center justify-center mb-6 border border-[var(--border)]/20">
              <span className="text-4xl animate-bounce">🎬</span>
            </div>
            <h3 className="text-2xl font-bold text-[var(--text-primary)] mb-2">That's all for now!</h3>
            <p className="text-[var(--text-secondary)] text-base max-w-[280px] mb-8">
              You've reached the end of the spotlight. Come back later for more!
            </p>
            <button
              onClick={() => {
                const firstReel = document.querySelector('.reel-container');
                if (firstReel) firstReel.scrollIntoView({ behavior: 'smooth' });
              }}
              className="px-8 py-3 bg-[var(--text-primary)] text-[var(--bg-primary)] font-bold rounded-full hover:opacity-90 transition-all active:scale-95"
            >
              Replay Feed
            </button>
          </div>
          
          {/* Loading indicator for infinite scroll */}
          {reelsPagination?.hasMoreReels && (
            <div className="h-32 w-full snap-start snap-always flex flex-col items-center justify-center pb-12 bg-[var(--bg-primary)]">
               <div className="w-8 h-8 border-4 border-[var(--border)]/20 border-t-[var(--accent)] rounded-full animate-spin" />
               <span className="text-[var(--text-secondary)] text-xs mt-3 uppercase tracking-widest font-bold">Loading Vibes</span>
            </div>
          )}
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
