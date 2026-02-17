import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineHome, AiFillHome, AiOutlinePlus } from "react-icons/ai";
import ReelsIcon from "./ReelsIcon";
import { IoSearch, IoSearchOutline } from "react-icons/io5";
import { RiAccountCircleFill, RiAccountCircleLine } from "react-icons/ri";
import CreatePostModal from "./CreatePostModal";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";
import AuraXIcon from "./AuraXIcon";

const NavigationBar = () => {
  const { user, isAuth, setShowLoginPrompt } = UserData();
  const { fetchPosts } = PostData();
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Get theme directly from localStorage (safe in client-side)
  const theme = localStorage.getItem('aurax-theme') || 'paper';

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

  return (
    <>
      {showCreateModal && <CreatePostModal setShow={setShowCreateModal} />}

      {showCreateModal && <CreatePostModal setShow={setShowCreateModal} />}

      <div className="md:hidden fixed bottom-0 left-0 w-full z-40 bg-[var(--bg-primary)]/90 backdrop-blur-md">
        <div className="flex justify-between items-center py-3 px-6 max-w-xl mx-auto">

          {/* Home */}
          <Link
            to={isAuth ? "/" : "/feed"}
            onClick={() => {
              if (tab === "/" || tab === "/feed") {
                window.scrollTo({ top: 0, behavior: "smooth" });
                fetchPosts();
              }
            }}
            className={`transition-all duration-200 ${tab === "/" || tab === "/feed" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/" || tab === "/feed" ? <AiFillHome className="w-7 h-7" /> : <AiOutlineHome className="w-7 h-7" />}
          </Link>

          {/* Search */}
          <Link
            to="/search"
            className={`transition-all duration-200 ${tab === "/search" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/search" ? <IoSearch className="w-7 h-7" /> : <IoSearchOutline className="w-7 h-7" />}
          </Link>

          {/* ADD POST BUTTON */}
          <button
            onClick={() => {
              if (isAuth) {
                setShowCreateModal(true);
              } else {
                setShowLoginPrompt(true);
              }
            }}
            className="transition-all duration-200 text-[var(--text-primary)] hover:text-[var(--accent)] hover:scale-110"
          >
            <AiOutlinePlus className="w-7 h-7" />
          </button>

          {/* Aura X*/}
          <Link
            to="/aurax"
            className={`transition-all duration-200 ${tab === "/aurax" ? activeStyle : inactiveStyle
              }`}
          >
            {theme === 'paper' ? <AuraXIcon size={28} /> : <span className="text-2xl">👻</span>}
          </Link> 

          {/* Reels */}
          <Link
            to="/reels"
            className={`transition-all duration-200 ${tab === "/reels" ? activeStyle : inactiveStyle
              }`}
          >
            <ReelsIcon size={28} />
          </Link>

          {/* Account */}
          <Link
            to="/account"
            className={`transition-all duration-200 ${tab === "/account" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/account" ? (
              isAuth && user?.profilePic?.url ? (
                <div className="relative flex items-center justify-center">
                  <img
                    src={user.profilePic.url}
                    alt="Profile"
                    className={`w-7 h-7 rounded-full object-cover border-2 ${tab === "/account" ? "border-[var(--accent)]" : "border-transparent"
                      }`}
                  />
                </div>
              ) : (
                <RiAccountCircleFill className="w-7 h-7" />
              )
            ) : isAuth && user?.profilePic?.url ? (
              <img
                src={user.profilePic.url}
                alt="Profile"
                className="w-7 h-7 rounded-full object-cover border-2 border-transparent"
              />
            ) : (
              <RiAccountCircleLine className="w-7 h-7" />
            )}
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavigationBar;
