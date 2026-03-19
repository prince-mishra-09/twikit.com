import React, { useState, useEffect, lazy, Suspense } from "react";
import { Link, useLocation } from "react-router-dom";
import ReelsIcon from "./ReelsIcon";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import { getOptimizedImage } from "../utils/imagekitUtils";

// Lazy-load CreatePostModal — not needed on initial paint
const CreatePostModal = lazy(() => import("./CreatePostModal"));

// ── Inline SVG Icons (zero bundle cost) ─────────────────────────────────────
const HomeIcon = ({ filled }) => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
    <path strokeLinecap="round" strokeLinejoin="round" d="m3 9.5 9-7 9 7V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z" />
    {!filled && <path strokeLinecap="round" strokeLinejoin="round" d="M9 21V12h6v9" />}
  </svg>
);
const SearchIcon = ({ filled }) => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={filled ? 2.5 : 1.8} strokeLinecap="round">
    <circle cx="11" cy="11" r="7" />
    <path d="m21 21-4.35-4.35" />
  </svg>
);
const PlusIcon = () => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round">
    <rect x="3" y="3" width="18" height="18" rx="3" />
    <path d="M12 8v8M8 12h8" />
  </svg>
);
const AccountCircleIcon = ({ filled }) => (
  <svg className="w-7 h-7" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth={1.8}>
    <circle cx="12" cy="12" r="9" />
    <circle cx="12" cy="10" r="3" />
    <path strokeLinecap="round" d="M6.168 18.849A4 4 0 0 1 10 17h4a4 4 0 0 1 3.832 1.849" />
  </svg>
);
// ────────────────────────────────────────────────────────────────────────────

const NavigationBar = () => {
  const { user, isAuth, setShowLoginPrompt } = UserData();
  const { fetchPosts } = PostData();
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    setTab(location.pathname);
  }, [location.pathname]);

  const activeStyle = "text-[var(--accent)] scale-110";
  const inactiveStyle = "text-[var(--text-primary)] opacity-100 hover:text-[var(--accent)] transition";

  // Hide Navbar on Reels, Chat, AuraX, Landing, and Auth pages
  const isLandingPage = (location.pathname === "/" && !isAuth) || location.pathname === "/landing";
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";
  const isAuraX = location.pathname === "/aurax";

  if (location.pathname === "/reels" || location.pathname === "/chat" || isAuraX || isLandingPage || isAuthPage) {
    return null;
  }

  const isHome = tab === "/" || tab === "/feed";

  return (
    <>
      {showCreateModal && (
        <Suspense fallback={null}>
          <CreatePostModal setShow={setShowCreateModal} />
        </Suspense>
      )}

      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-[var(--bg-primary)]/90 backdrop-blur-md">
        <div className="flex justify-between items-center py-3 px-6 max-w-xl mx-auto">

          {/* Home */}
          <Link
            to={isAuth ? "/" : "/feed"}
            onClick={() => {
              if (isHome) {
                window.scrollTo({ top: 0, behavior: "smooth" });
                fetchPosts();
              }
            }}
            className={`transition-all duration-200 ${isHome ? activeStyle : inactiveStyle}`}
          >
            <HomeIcon filled={isHome} />
          </Link>

          {/* Search */}
          <Link to="/search" className={`transition-all duration-200 ${tab === "/search" ? activeStyle : inactiveStyle}`}>
            <SearchIcon filled={tab === "/search"} />
          </Link>

          {/* ADD POST BUTTON */}
          <button
            onClick={() => isAuth ? setShowCreateModal(true) : setShowLoginPrompt(true)}
            className="transition-all duration-200 text-[var(--text-primary)] hover:text-[var(--accent)] hover:scale-110"
          >
            <PlusIcon />
          </button>

          {/* Reels */}
          <Link to="/reels" className={`transition-all duration-200 ${tab === "/reels" ? activeStyle : inactiveStyle}`}>
            <ReelsIcon size={28} />
          </Link>

          {/* Account */}
          <Link to="/account" className={`transition-all duration-200 ${tab === "/account" ? activeStyle : inactiveStyle}`}>
            {isAuth && user?.profilePic?.url ? (
              <img
                src={getOptimizedImage(user.profilePic.url, { isProfilePic: true, updatedAt: user.updatedAt, width: 100 })}
                alt="Profile"
                className={`w-7 h-7 rounded-full object-cover border-2 ${tab === "/account" ? "border-[var(--accent)]" : "border-transparent"}`}
              />
            ) : (
              <AccountCircleIcon filled={tab === "/account"} />
            )}
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavigationBar;
