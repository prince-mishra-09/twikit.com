import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineHome, AiFillHome, AiOutlinePlus } from "react-icons/ai";
import { BsCameraReelsFill, BsCameraReels } from "react-icons/bs";
import { IoSearchCircleOutline, IoSearchCircle } from "react-icons/io5";
import { RiAccountCircleFill, RiAccountCircleLine } from "react-icons/ri";
import CreatePostModal from "./CreatePostModal";
import { UserData } from "../context/UserContext";
import { PostData } from "../context/PostContext";


const NavigationBar = () => {
  const { isAuth, setShowLoginPrompt } = UserData();
  const { fetchPosts } = PostData();
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname);
  const [showCreateModal, setShowCreateModal] = useState(false);



  useEffect(() => {
    setTab(location.pathname);
  }, [location.pathname]);

  const activeStyle = "text-[var(--accent)] scale-110";
  const inactiveStyle = "text-[var(--text-primary)] opacity-100 hover:text-[var(--accent)] transition";

  // Hide Navbar on Reels and Chat pages
  // Hide Navbar on Reels, Chat, Landing, and Auth pages
  const isLandingPage = (location.pathname === "/" && !isAuth) || location.pathname === "/landing";
  const isAuthPage = location.pathname === "/login" || location.pathname === "/register";

  if (location.pathname === "/reels" || location.pathname === "/chat" || isLandingPage || isAuthPage) {
    return null;
  }

  return (
    <>
      {showCreateModal && <CreatePostModal setShow={setShowCreateModal} />}

      <div className="fixed bottom-0 left-0 w-full z-40 bg-[var(--card-bg)]/95 backdrop-blur-xl">
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
            className={`text-3xl transition-all duration-200 ${tab === "/" || tab === "/feed" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/" || tab === "/feed" ? <AiFillHome /> : <AiOutlineHome />}
          </Link>

          {/* Search */}
          <Link
            to="/search"
            className={`text-3xl transition-all duration-200 ${tab === "/search" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/search" ? <IoSearchCircle className="text-3xl" /> : <IoSearchCircleOutline className="text-3xl" />}
          </Link>

          {/* ADD POST BUTTON (CENTER) */}
          <button
            onClick={() => {
              if (isAuth) {
                setShowCreateModal(true);
              } else {
                setShowLoginPrompt(true);
              }
            }}
            className="bg-[var(--accent)] text-[var(--bg-secondary)] p-3 rounded-xl shadow-lg shadow-[var(--accent)]/30 hover:opacity-90 hover:scale-105 transition-all -mt-8 border-4 border-[var(--bg-primary)]"
          >
            <AiOutlinePlus className="text-2xl font-bold" />
          </button>

          {/* Reels */}
          <Link
            to="/reels"
            className={`text-3xl transition-all duration-200 ${tab === "/reels" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/reels" ? <BsCameraReelsFill /> : <BsCameraReels />}
          </Link>

          {/* Account */}
          <Link
            to="/account"
            className={`text-3xl transition-all duration-200 ${tab === "/account" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/account" ? <RiAccountCircleFill /> : <RiAccountCircleLine />}
          </Link>
        </div>
      </div>
    </>
  );
};

export default NavigationBar;
