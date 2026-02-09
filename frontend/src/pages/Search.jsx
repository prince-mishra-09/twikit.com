import axios from "axios";
import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { LoadingAnimation } from "../components/Loading";
import { FaSearch, FaCompass } from "react-icons/fa";
import PostCard from "../components/PostCard";
import { PostData } from "../context/PostContext";

const Search = () => {
  const [users, setUsers] = useState([]);
  const [posts, setPosts] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Global content for Explore Feed
  const { reels: globalReels, posts: globalPosts } = PostData();

  // Scroll to top on mount
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Derived state to separate Search Results
  const actualPosts = posts.filter(p => p.type === 'post');
  const actualReels = posts.filter(p => p.type === 'reel');

  async function fetchUsers() {
    if (!search.trim()) {
      setUsers([]);
      setPosts([]);
      setHasSearched(false);
      return;
    }

    setLoading(true);
    setHasSearched(true);
    try {
      const { data } = await axios.get(
        "/api/user/all?search=" + search.trim()
      );
      // data = { users: [], posts: [] }
      setUsers(data.users || []);
      setPosts(data.posts || []);
    } catch (error) {
      console.log(error);
      setUsers([]);
      setPosts([]);
    } finally {
      setLoading(false);
    }
  }

  // Split users into top 10 and remaining
  const topUsers = users.slice(0, 10);
  const remainingUsers = users.slice(10);

  // Explore Content: Mix global reels and posts
  const exploreContent = useMemo(() => {
    if (!globalReels || !globalPosts) return [];
    const mixed = [...globalReels, ...globalPosts];
    // Simple shuffle
    return mixed.sort(() => Math.random() - 0.5).slice(0, 20);
  }, [globalReels, globalPosts]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)] pb-24 pt-2 overflow-x-hidden">
      {/* SEARCH BAR */}
      {/* SEARCH BAR */}
      <div className="sticky top-0 z-20 bg-[var(--bg-primary)]/90 backdrop-blur-md border-b border-[var(--border)] px-2 py-3 mb-4">
        <div className="flex items-center gap-3">
          <div className="flex-1 min-w-0 flex items-center gap-3 bg-[var(--bg-secondary)] rounded-full px-4 py-2.5 border border-transparent focus-within:border-[var(--accent)] transition-all group">
            <FaSearch className="text-[var(--text-secondary)] group-focus-within:text-[var(--accent)] transition-colors" />
            <input
              type="text"
              className="flex-1 bg-transparent outline-none text-[var(--text-primary)] placeholder-[var(--text-secondary)] text-base md:text-sm"
              placeholder="Search..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchUsers()}

            />
          </div>
          <button
            onClick={fetchUsers}
            className="bg-[var(--accent)] hover:opacity-90 active:scale-95 text-white px-4 py-2.5 rounded-full text-sm font-bold transition-all shadow-lg shadow-[var(--accent)]/20 flex items-center justify-center gap-2"
          >
            <FaSearch className="md:hidden text-lg" />
            <span className="hidden md:inline">Search</span>
          </button>
        </div>
      </div>

      {/* RESULTS or EXPLORE */}
      <div className="w-full">
        {loading ? (
          <div className="flex justify-center mt-10">
            <LoadingAnimation />
          </div>
        ) : (users.length > 0 || posts.length > 0) ? (
          <div className="space-y-4">
            {/* 1. Top 10 Users */}
            {topUsers.map((u) => (
              <Link
                key={u._id}
                to={`/user/${u._id}`}
                className="flex items-start gap-3 px-3 py-3 rounded-xl bg-[var(--card-bg)]/50 border border-[var(--border)] hover:bg-[var(--card-bg)] transition-all"
              >
                <img
                  src={u?.profilePic?.url || "/default-avatar.png"}
                  alt="profile"
                  className="w-12 h-12 rounded-full object-cover border border-[var(--border)] shrink-0"
                />
                <div className="flex flex-col flex-1 min-w-0">
                  <p className="text-[var(--text-primary)] font-bold text-base truncate max-w-full">{u.name}</p>
                  <p className="text-[var(--text-secondary)] text-sm truncate max-w-full">@{u.username}</p>
                  {u.bio && (
                    <p className="text-[var(--text-secondary)] text-xs mt-1.5 line-clamp-2 break-words leading-relaxed">
                      {u.bio}
                    </p>
                  )}
                </div>
              </Link>
            ))}

            {/* 2. REELS GRID (Search Results) */}
            {actualReels.length > 0 && (
              <div className="pt-4 pb-2">
                <h3 className="text-[var(--accent)] font-semibold text-sm mb-3 px-2 uppercase tracking-wider">Reels</h3>
                <div className="grid grid-cols-2 gap-2 px-1">
                  {actualReels.map((reel) => (
                    <SearchReelItem key={reel._id} reel={reel} />
                  ))}
                </div>
              </div>
            )}

            {/* 3. POSTS LIST (Search Results) */}
            {actualPosts.length > 0 && (
              <div className="pt-4 pb-2">
                <h3 className="text-[var(--accent)] font-semibold text-sm mb-3 px-2 uppercase tracking-wider">Posts from results</h3>
                <div className="space-y-4 px-1">
                  {actualPosts.map((post) => (
                    <PostCard key={post._id} value={post} type="post" />
                  ))}
                </div>
              </div>
            )}

            {/* 4. Remaining Users */}
            {remainingUsers.length > 0 && (
              <div className="pt-2">
                {posts.length > 0 && <h3 className="text-[var(--text-secondary)] font-semibold text-sm mb-3 px-2 uppercase tracking-wider">More Profiles</h3>}
                {remainingUsers.map((u) => (
                  <Link
                    key={u._id}
                    to={`/user/${u._id}`}
                    className="flex items-start gap-3 px-3 py-3 rounded-xl bg-[var(--card-bg)]/50 border border-[var(--border)] hover:bg-[var(--card-bg)] transition-all mb-4"
                  >
                    <img
                      src={u?.profilePic?.url || "/default-avatar.png"}
                      alt="profile"
                      className="w-12 h-12 rounded-full object-cover border border-[var(--border)] shrink-0"
                    />
                    <div className="flex flex-col flex-1 min-w-0">
                      <p className="text-[var(--text-primary)] font-bold text-base truncate max-w-full">{u.name}</p>
                      <p className="text-[var(--text-secondary)] text-sm truncate max-w-full">@{u.username}</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        ) : hasSearched && search.trim() ? (
          <div className="text-center mt-10">
            <p className="text-[var(--text-secondary)] text-lg font-medium">No results found for "{search}"</p>
            <p className="text-[var(--text-secondary)] text-sm mt-2">Try searching for a specific username or name.</p>
          </div>
        ) : (
          // EXPLORE FEED (Empty State)
          <div className="mt-4 animate-in fade-in duration-500">
            <div className="flex items-center gap-2 mb-4 px-2">
              <FaCompass className="text-[var(--accent)] text-lg" />
              <h2 className="text-[var(--text-primary)] font-bold text-lg">Explore</h2>
            </div>

            <div className="columns-2 gap-2 pb-28 px-1 space-y-2">
              {exploreContent.map((item) => {
                if (item.type === 'reel') {
                  return (
                    <div key={item._id} className="break-inside-avoid w-full overflow-hidden">
                      <SearchReelItem reel={item} />
                    </div>
                  );
                } else {
                  return (
                    <div key={item._id} className="break-inside-avoid w-full rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card-bg)]">
                      {item.post?.url && (
                        <Link to={`/post/${item._id}`}>
                          <img src={item.post.url} alt="" className="w-full max-w-full h-auto object-cover aspect-[3/4]" />
                        </Link>
                      )}
                      <div className="p-2">
                        <div className="flex items-center gap-2 mb-1">
                          <img src={item.owner?.profilePic?.url} className="w-5 h-5 rounded-full object-cover shrink-0" />
                          <span className="text-xs text-[var(--text-primary)] font-bold truncate max-w-[80px]">{item.owner?.name}</span>
                        </div>
                        {item.caption && <p className="text-[10px] text-[var(--text-secondary)] line-clamp-2 break-all">{item.caption}</p>}
                      </div>
                    </div>
                  )
                }
              })}
            </div>

            {exploreContent.length === 0 && (
              <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                <FaSearch className="text-6xl text-[var(--text-secondary)] mb-4" />
                <p className="text-[var(--text-secondary)]">Search for people, posts, and more</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

// --- Sub-component for Reel Grid Item with Autoplay ---
const SearchReelItem = ({ reel }) => {
  const [isPlaying, setIsPlaying] = React.useState(false);
  const videoRef = React.useRef(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsPlaying(true);
            // Optional: try to play if state updates aren't enough (some browsers block auto-play without user interaction initially, but usually mute works)
            if (videoRef.current) {
              videoRef.current.play().catch(e => { /* silent fail for autoplay blocks */ });
            }
          } else {
            setIsPlaying(false);
            if (videoRef.current) {
              videoRef.current.pause();
              videoRef.current.currentTime = 0; // Reset preview
            }
          }
        });
      },
      { threshold: 0.7 } // 70% visible
    );

    if (videoRef.current) observer.observe(videoRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <Link to={`/reels?id=${reel._id}`} className="relative block aspect-[9/16] rounded-xl overflow-hidden group border border-[var(--border)]">
      <video
        ref={videoRef}
        src={reel.post.url}
        className="w-full h-full object-cover"
        muted
        loop
        playsInline
      />

      {/* Overlay info */}
      {/* Overlay info */}
      <div className="absolute bottom-0 inset-x-0 p-2 flex flex-col justify-end pointer-events-none">
        <div className="flex items-center gap-1.5 mb-1">
          <img src={reel.owner?.profilePic?.url} className="w-5 h-5 rounded-full border border-white/30 object-cover shrink-0" alt="" />
          <span className="text-white text-[10px] font-bold truncate drop-shadow-md max-w-[80px]">{reel.owner?.name}</span>
        </div>
        {reel.caption && <p className="text-white/90 text-[10px] line-clamp-2 leading-tight drop-shadow-md break-all">{reel.caption}</p>}
      </div>

      {/* Play Icon Hint */}
      <div className={`absolute top-2 right-2 p-1.5 bg-black/50 rounded-full backdrop-blur transition-opacity ${isPlaying ? 'opacity-0' : 'opacity-100'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4 text-white">
          <path fillRule="evenodd" d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
        </svg>
      </div>
    </Link>
  );
};

export default Search;
