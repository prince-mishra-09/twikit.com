import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { AiOutlineHome, AiFillHome, AiOutlinePlus } from "react-icons/ai";
import { BsCameraReelsFill, BsCameraReels } from "react-icons/bs";
import { IoSearchCircleOutline, IoSearchCircle } from "react-icons/io5";
import { RiAccountCircleFill, RiAccountCircleLine } from "react-icons/ri";
import CreatePostModal from "./CreatePostModal";


const NavigationBar = () => {
  const location = useLocation();
  const [tab, setTab] = useState(location.pathname);
  const [showCreateModal, setShowCreateModal] = useState(false);



  useEffect(() => {
    setTab(location.pathname);
  }, [location.pathname]);

  const activeStyle = "text-[var(--accent)] scale-110";
  const inactiveStyle = "text-gray-400 hover:text-[var(--accent)] transition";

  // Hide Navbar on Reels and Chat pages
  if (location.pathname === "/reels" || location.pathname === "/chat") {
    return null;
  }

  return (
    <>
      {showCreateModal && <CreatePostModal setShow={setShowCreateModal} />}

      <div className="fixed bottom-0 left-0 w-full z-40 border-t border-white/10 bg-[#0B0F14]/90 backdrop-blur-xl">
        <div className="flex justify-between items-center py-3 px-6 max-w-xl mx-auto">

          {/* Home */}
          <Link
            to="/"
            className={`text-2xl transition-all duration-200 ${tab === "/" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/" ? <AiFillHome /> : <AiOutlineHome />}
          </Link>

          {/* Search */}
          <Link
            to="/search"
            className={`text-2xl transition-all duration-200 ${tab === "/search" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/search" ? <IoSearchCircle className="text-3xl" /> : <IoSearchCircleOutline className="text-3xl" />}
          </Link>

          {/* ADD POST BUTTON (CENTER) */}
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-[var(--accent)] text-white p-3 rounded-xl shadow-lg shadow-[var(--accent)]/30 hover:opacity-90 hover:scale-105 transition-all -mt-8 border-4 border-[#0B0F14]"
          >
            <AiOutlinePlus className="text-2xl font-bold" />
          </button>

          {/* Reels */}
          <Link
            to="/reels"
            className={`text-2xl transition-all duration-200 ${tab === "/reels" ? activeStyle : inactiveStyle
              }`}
          >
            {tab === "/reels" ? <BsCameraReelsFill /> : <BsCameraReels />}
          </Link>

          {/* Account */}
          <Link
            to="/account"
            className={`text-2xl transition-all duration-200 ${tab === "/account" ? activeStyle : inactiveStyle
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
